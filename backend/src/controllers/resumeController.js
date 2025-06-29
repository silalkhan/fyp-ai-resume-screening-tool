const { validationResult } = require('express-validator')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const Resume = require('../models/Resume')
const JobDescription = require('../models/JobDescription')
const logger = require('../utils/logger')
const { sendShortlistNotification } = require('../utils/emailService')

const PYTHON_API_URL = process.env.NLP_API_URL || 'http://localhost:5002'
const MAX_CHECK_ATTEMPTS = 30 // 30 attempts with 1s delay = 30s max
const CHECK_INTERVAL = 1000 // 1 second

// Initialize axios instance for NLP service with proper configuration
const nlpApiClient = axios.create({
  baseURL: PYTHON_API_URL,
  timeout: 60000, // 60 second timeout
  // Add retry mechanism
  maxRetries: 3,
  retryDelay: 1000,
  validateStatus: function (status) {
    return (status >= 200 && status < 300) || status === 408 || status === 429
  },
})

// Add a request interceptor for retries
nlpApiClient.interceptors.request.use(async (config) => {
  config.metadata = { ...config.metadata, startTime: new Date() }
  return config
})

// Add a response interceptor for handling retries
nlpApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // If no metadata or retry count exists, initialize them
    if (!config.metadata) {
      config.metadata = {}
    }

    config.retryCount = config.retryCount || 0

    // Check if we should retry the request
    const shouldRetry =
      config.retryCount < config.maxRetries &&
      (error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        (error.response && (error.response.status === 408 || error.response.status === 429)))

    if (shouldRetry) {
      config.retryCount += 1
      const delayTime = config.retryDelay * Math.pow(2, config.retryCount - 1)

      logger.info(
        `Retrying request to ${config.url} (attempt ${config.retryCount} of ${config.maxRetries})`
      )
      await new Promise((resolve) => setTimeout(resolve, delayTime))

      return nlpApiClient(config)
    }

    return Promise.reject(error)
  }
)

// Log the NLP API URL for debugging
logger.info(`NLP API URL configured as: ${PYTHON_API_URL}`)

const updateShortlistStatus = async (resumeId, jobDescriptionId) => {
  const resumes = await Resume.find({ jobDescriptionId, processed: true }).sort({ matchScore: -1 })
  const topTen = resumes.slice(0, 10)
  const shortlistIds = topTen.filter((r) => r.matchScore >= 75).map((r) => r._id.toString())

  await Resume.updateMany({ jobDescriptionId, processed: true }, { $set: { shortlisted: false } })

  if (shortlistIds.length > 0) {
    await Resume.updateMany({ _id: { $in: shortlistIds } }, { $set: { shortlisted: true } })
  }

  const resume = await Resume.findById(resumeId)
  if (resume.shortlisted && resume.contactInfo && resume.contactInfo.email) {
    const job = await JobDescription.findById(jobDescriptionId)
    try {
      const success = await sendShortlistNotification(
        resume.contactInfo.email,
        resume.candidateName,
        job.title,
        resume.matchScore
      )
      if (!success) {
        logger.error(`Email notification failed to send for resume ${resumeId}`)
      }
    } catch (err) {
      logger.error(`Email notification failed for resume ${resumeId}: ${err.message}`)
    }
  }
}

const checkTaskStatus = async (taskId, maxAttempts = MAX_CHECK_ATTEMPTS) => {
  try {
    logger.info(`Checking task status for task ${taskId}, attempts left: ${maxAttempts}`)

    if (!taskId) {
      logger.error('No task ID provided for status check')
      return { success: false, error: 'No task ID provided' }
    }

    try {
      // Calculate delay with exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, MAX_CHECK_ATTEMPTS - maxAttempts), 10000)

      const taskResponse = await nlpApiClient.get(`/api/task/${taskId}`, {
        timeout: 30000, // 30 second timeout for status checks
        retryCount: 0, // Reset retry count
        retryDelay: backoffDelay,
      })

      // Log full response for debugging
      logger.info(`Task ${taskId} status response:`, {
        status: taskResponse.data.status,
        success: taskResponse.data.success,
        hasResult: !!taskResponse.data.result,
        resultSuccess: taskResponse.data.result?.success,
        error: taskResponse.data.error,
        remainingAttempts: maxAttempts,
      })

      // Check for success in both the main response and the result object
      if (
        taskResponse.data.status === 'completed' ||
        taskResponse.data.status === 'success' ||
        taskResponse.data.status === 'done'
      ) {
        // First check if the overall response indicates success
        if (taskResponse.data.success === true) {
          // Then check if there's a result object
          if (taskResponse.data.result) {
            logger.info(`Task ${taskId} completed successfully with result`)
            return { success: true, data: taskResponse.data.result }
          } else {
            // Success but no result - this is unusual
            logger.warn(`Task ${taskId} marked as success but has no result data`)
            return { success: false, error: 'Task completed but no result data was returned' }
          }
        } else {
          // Task completed but not successful
          const error = taskResponse.data.error || 'Task completed without success'
          logger.error(`Task ${taskId} completed but failed: ${error}`)
          return {
            success: false,
            error,
            details: taskResponse.data.result,
          }
        }
      } else if (taskResponse.data.status === 'failed' || taskResponse.data.success === false) {
        const error = taskResponse.data.error || 'Unknown error'
        logger.error(`Task ${taskId} failed: ${error}`)
        return {
          success: false,
          error,
          details: taskResponse.data,
        }
      } else if (maxAttempts <= 0) {
        const timeoutError = `Task processing timeout after ${MAX_CHECK_ATTEMPTS} attempts`
        logger.error(`Task ${taskId} ${timeoutError}`)
        return {
          success: false,
          error: timeoutError,
          retriable: true,
        }
      } else {
        // Still processing
        logger.info(
          `Task ${taskId} still processing, status: ${taskResponse.data.status}, attempts left: ${maxAttempts}`
        )

        // Wait with exponential backoff before trying again
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        return checkTaskStatus(taskId, maxAttempts - 1)
      }
    } catch (apiError) {
      logger.error(`API error while checking task status: ${apiError.message}`)

      // Log detailed API error info
      if (apiError.response) {
        logger.error('API Response Details:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data,
          headers: apiError.response.headers,
        })
      } else if (apiError.request) {
        logger.error('API Request Details:', {
          method: apiError.config?.method,
          url: apiError.config?.url,
          headers: apiError.config?.headers,
          timeout: apiError.config?.timeout,
        })
      }

      // For network or server errors, retry if we have attempts left
      if (maxAttempts <= 0) {
        return {
          success: false,
          error: `API error: ${apiError.message}`,
          details: apiError.response?.data,
          retriable: true,
        }
      }

      // Wait before retrying
      const retryDelay = Math.min(1000 * Math.pow(2, MAX_CHECK_ATTEMPTS - maxAttempts), 10000)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))

      // For transient errors, retry
      return checkTaskStatus(taskId, maxAttempts - 1)
    }
  } catch (error) {
    logger.error(`Task status check failed for task ${taskId}:`, {
      error: error.message,
      stack: error.stack,
      taskId,
    })
    return {
      success: false,
      error: error.message,
      retriable: true,
    }
  }
}

const processResumeAsync = async (resumeId, taskId, jobCategory) => {
  try {
    logger.info(`Starting async processing for resume ${resumeId} with task ${taskId}`)

    // First update to indicate processing has started
    await Resume.findByIdAndUpdate(resumeId, {
      processing: true,
      processed: false,
      processingError: null,
      taskId: taskId,
    })

    // Poll until we get a result
    let maxAttempts = 30 // 5 minutes with 10-second intervals
    let result = null
    let lastError = null

    while (maxAttempts > 0) {
      try {
        const processResponse = await checkTaskStatus(taskId)
        logger.info(`Task ${taskId} check response:`, processResponse)

        if (processResponse.success && processResponse.data) {
          result = processResponse.data
          break
        } else if (processResponse.error || processResponse.status === 'failed') {
          throw new Error(processResponse.error || 'Processing failed')
        }

        // Wait 10 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 10000))
        maxAttempts--
        lastError = processResponse.error
      } catch (error) {
        logger.error(`Error checking task status: ${error.message}`)

        // Update resume document with detailed error
        await Resume.findByIdAndUpdate(resumeId, {
          processing: false,
          processed: false,
          processingError: `Processing error: ${error.message}. Please try again.`,
        })

        throw error
      }
    }

    if (!maxAttempts) {
      throw new Error(`Processing timed out. Last error: ${lastError || 'Unknown'}`)
    }

    if (!result || !result.data) {
      throw new Error('Invalid result data from NLP service')
    }

    const resultData = result.data
    logger.info(`Resume ${resumeId} processed successfully, updating with results:`, {
      matchScore: resultData.matchScore,
      skillsCount: resultData.skills?.length,
      educationCount: resultData.education?.length,
      experienceCount: resultData.experience?.length,
      projectsCount: resultData.projects?.length,
    })

    // Update resume with processed data
    const updatedResume = await Resume.findByIdAndUpdate(
      resumeId,
      {
        candidateName: resultData.candidateName || '',
        contactInfo: resultData.contactInfo || {},
        processedData: {
          skills: resultData.skills || [],
          education: resultData.education || [],
          experience: resultData.experience || [],
          projects: resultData.projects || [],
        },
        matchScore: resultData.matchScore || 0,
        processing: false,
        processed: true,
        processingError: null,
      },
      { new: true }
    )

    if (!updatedResume) {
      throw new Error('Failed to update resume with processed data')
    }

    logger.info(
      `Resume ${resumeId} updated successfully with match score: ${resultData.matchScore}`
    )
    await updateShortlistStatus(resumeId, updatedResume.jobDescriptionId)
  } catch (error) {
    logger.error(`Processing failed for resume ${resumeId}: ${error.message}`)

    // Update resume with error state
    await Resume.findByIdAndUpdate(resumeId, {
      processing: false,
      processed: false,
      processingError: `Processing failed: ${error.message}`,
    })

    throw error
  }
}

exports.uploadResume = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    // Validate file upload
    if (!req.file) {
      logger.warn('No file uploaded')
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    logger.info(`Processing file upload: ${req.file.originalname}, size: ${req.file.size} bytes`)
    logger.info(`File MIME type: ${req.file.mimetype}, File path: ${req.file.path}`)

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      logger.error(`Uploaded file not found at path: ${req.file.path}`)
      return res
        .status(500)
        .json({ success: false, message: 'File upload failed - file not found' })
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      logger.warn(`Invalid file type: ${req.file.mimetype}`)
      return res
        .status(400)
        .json({ success: false, message: 'Only PDF and DOCX files are allowed' })
    }

    // Validate job description
    const { jobDescriptionId } = req.body
    if (!jobDescriptionId) {
      logger.warn('No jobDescriptionId provided in request body')
      return res.status(400).json({ success: false, message: 'Job description ID is required' })
    }

    const job = await JobDescription.findById(jobDescriptionId)
    if (!job) {
      logger.warn(`Job description not found: ${jobDescriptionId}`)
      return res.status(404).json({ success: false, message: 'Job description not found' })
    }

    // Create resume document in MongoDB
    const resume = new Resume({
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      jobDescriptionId,
      uploadDate: new Date(),
      processed: false,
      processing: true,
      taskId: null,
      processingError: null,
    })

    logger.info(`Saving resume to database: ${resume._id}`)
    const savedResume = await resume.save()

    try {
      logger.info(`Starting NLP processing for resume: ${savedResume._id}`)

      // Create form data for NLP service
      const formData = new FormData()
      formData.append('resume', fs.createReadStream(req.file.path))
      formData.append('jobDescription', job.description)
      formData.append('jobCategory', job.category)

      if (job.requiredSkills && job.requiredSkills.length > 0) {
        formData.append('requiredSkills', job.requiredSkills.join(','))
      }

      // Send request to NLP service
      const response = await nlpApiClient.post('/api/process', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'NLP processing failed')
      }

      // Save task ID immediately
      const taskId = response.data.taskId
      logger.info(`NLP processing task created: ${taskId} for resume: ${savedResume._id}`)

      await Resume.findByIdAndUpdate(savedResume._id, {
        taskId: taskId,
        processing: true,
        processed: false,
        processingError: null,
      })

      // Start async processing
      processResumeAsync(savedResume._id, taskId, job.category).catch((err) => {
        logger.error(`Unhandled error in async resume processing: ${err.message}`)
      })

      // Return response with taskId
      res.status(202).json({
        success: true,
        message: 'Resume uploaded successfully. Processing in progress.',
        data: { ...savedResume.toObject(), taskId },
      })
    } catch (error) {
      logger.error(`Error starting resume processing: ${error.message}`)
      await Resume.findByIdAndUpdate(savedResume._id, {
        processing: false,
        processed: false,
        processingError: `Failed to start processing: ${error.message}`,
      })
      res.status(500).json({ success: false, message: 'Failed to start resume processing' })
    }
  } catch (err) {
    logger.error(`Upload resume error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getAllResumes = async (req, res) => {
  try {
    const { jobDescriptionId } = req.query
    const query = jobDescriptionId ? { jobDescriptionId } : {}
    const resumes = await Resume.find(query).sort({ matchScore: -1, uploadDate: -1 })
    res.status(200).json({ success: true, count: resumes.length, data: resumes })
  } catch (err) {
    logger.error(`Get all resumes error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume) {
      logger.warn(`Resume not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Resume not found' })
    }
    res.status(200).json({ success: true, data: resume })
  } catch (err) {
    logger.error(`Get resume error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume) {
      logger.warn(`Resume not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Resume not found' })
    }
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath)
      logger.info(`File deleted: ${resume.filePath}`)
    }
    await Resume.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Resume deleted successfully' })
  } catch (err) {
    logger.error(`Delete resume error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.processResumeWithAI = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume) {
      logger.warn(`Resume not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Resume not found' })
    }
    if (!fs.existsSync(resume.filePath)) {
      logger.warn(`Resume file missing: ${resume.filePath}`)
      return res.status(400).json({ success: false, message: 'Resume file not found' })
    }

    const { jobDescriptionId } = req.body
    const job = await JobDescription.findById(jobDescriptionId)
    if (!job) {
      logger.warn(`Job description not found: ${jobDescriptionId}`)
      return res.status(404).json({ success: false, message: 'Job description not found' })
    }

    // Update resume status
    await Resume.findByIdAndUpdate(req.params.id, {
      processing: true,
      processed: false,
      processingError: null,
    })

    const formData = new FormData()
    formData.append('resume', fs.createReadStream(resume.filePath))
    formData.append('jobDescription', job.description)
    formData.append('jobCategory', job.category)
    formData.append('requiredSkills', job.requiredSkills.join(','))

    const response = await axios.post(`${PYTHON_API_URL}/api/process`, formData, {
      headers: { ...formData.getHeaders() },
    })

    if (!response.data.success) {
      logger.error(`NLP processing failed: ${response.data.message}`)
      return res.status(400).json({ success: false, message: response.data.message })
    }

    resume.taskId = response.data.taskId
    await resume.save()

    res.status(202).json({
      success: true,
      message: 'Resume processing started',
      taskId: response.data.taskId,
    })

    // Process asynchronously
    const processAsync = async () => {
      try {
        const processResponse = await checkTaskStatus(response.data.taskId)
        if (!processResponse.success) {
          await Resume.findByIdAndUpdate(resume._id, {
            processing: false,
            processed: false,
            processingError: processResponse.error || 'Processing failed',
          })
          return
        }

        const result = processResponse.data
        if (!result || !result.data) {
          await Resume.findByIdAndUpdate(resume._id, {
            processing: false,
            processed: false,
            processingError: 'Invalid result data',
          })
          return
        }

        const resultData = result.data
        await Resume.findByIdAndUpdate(resume._id, {
          candidateName: resultData.candidateName || '',
          contactInfo: resultData.contactInfo || {},
          processedData: {
            skills: resultData.skills || [],
            education: resultData.education || [],
            experience: resultData.experience || [],
            projects: resultData.projects || [],
          },
          matchScore: resultData.matchScore || 0,
          processing: false,
          processed: true,
        })

        await updateShortlistStatus(resume._id, jobDescriptionId)
      } catch (error) {
        logger.error(`Async processing error for resume ${resume._id}: ${error.message}`)
        await Resume.findByIdAndUpdate(resume._id, {
          processing: false,
          processed: false,
          processingError: error.message,
        })
      }
    }

    processAsync().catch((err) => {
      logger.error(`Unhandled error in async processing: ${err.message}`)
    })
  } catch (err) {
    logger.error(`Process resume error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.compareResumeToJob = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params
    const resume = await Resume.findById(resumeId)
    if (!resume) {
      logger.warn(`Resume not found: ${resumeId}`)
      return res.status(404).json({ success: false, message: 'Resume not found' })
    }

    const job = await JobDescription.findById(jobDescriptionId)
    if (!job) {
      logger.warn(`Job description not found: ${jobDescriptionId}`)
      return res.status(404).json({ success: false, message: 'Job description not found' })
    }

    if (!fs.existsSync(resume.filePath)) {
      logger.warn(`Resume file missing: ${resume.filePath}`)
      return res.status(400).json({ success: false, message: 'Resume file not found' })
    }

    const formData = new FormData()
    formData.append('resume', fs.createReadStream(resume.filePath))
    formData.append('jobDescription', job.description)
    formData.append('requiredSkills', job.requiredSkills.join(','))

    const response = await axios.post(`${PYTHON_API_URL}/api/process`, formData, {
      headers: { ...formData.getHeaders() },
    })

    if (!response.data.success) {
      logger.error(`NLP processing failed: ${response.data.message}`)
      return res.status(400).json({ success: false, message: response.data.message })
    }

    const taskId = response.data.taskId
    const checkTaskStatus = async () => {
      try {
        const taskResponse = await axios.get(`${PYTHON_API_URL}/api/task/${taskId}`)
        if (taskResponse.data.status === 'completed' && taskResponse.data.result.success) {
          const result = taskResponse.data.result.data
          await Resume.findByIdAndUpdate(resumeId, {
            matchScore: result.matchScore,
            processedData: {
              skills: result.skills,
              education: result.education,
              experience: result.experience,
              projects: result.projects,
            },
            jobDescriptionId,
          })
          logger.info(`Resume compared: ${resumeId}`)
          await updateShortlistStatus(resumeId, jobDescriptionId)
          res.status(200).json({
            success: true,
            matchScore: result.matchScore,
            skills: {
              resume: result.skills,
              job: job.requiredSkills.concat(job.preferredSkills),
            },
            shortlisted: (await Resume.findById(resumeId)).shortlisted,
          })
        } else if (taskResponse.data.status === 'failed') {
          logger.error(`Task failed: ${taskResponse.data.error}`)
          res.status(400).json({ success: false, message: taskResponse.data.error })
        } else {
          setTimeout(checkTaskStatus, 1000)
        }
      } catch (err) {
        logger.error(`Task status check failed: ${err.message}`)
        res.status(500).json({ success: false, message: 'Server error' })
      }
    }

    setTimeout(checkTaskStatus, 1000)
  } catch (err) {
    logger.error(`Compare resume error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.detectDuplicates = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume) {
      logger.warn(`Resume not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Resume not found' })
    }
    if (!fs.existsSync(resume.filePath)) {
      logger.warn(`Resume file missing: ${resume.filePath}`)
      return res.status(400).json({ success: false, message: 'Resume file not found' })
    }

    const otherResumes = await Resume.find({ _id: { $ne: resume._id } })
    if (!otherResumes.length) {
      return res.status(200).json({ success: true, isDuplicate: false, duplicates: [] })
    }

    const formData = new FormData()
    formData.append('resume', fs.createReadStream(resume.filePath))
    otherResumes.forEach((r, i) => {
      if (fs.existsSync(r.filePath)) {
        formData.append(`existingResume${i}`, fs.createReadStream(r.filePath))
      }
    })

    const response = await axios.post(`${PYTHON_API_URL}/api/detect-duplicates`, formData, {
      headers: { ...formData.getHeaders() },
    })

    if (!response.data.success) {
      logger.error(`Duplicate detection failed: ${response.data.message}`)
      return res.status(400).json({ success: false, message: response.data.message })
    }

    res.status(200).json({
      success: true,
      isDuplicate: response.data.isDuplicate,
      duplicates: response.data.duplicates,
    })
  } catch (err) {
    logger.error(`Detect duplicates error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getShortlistedResumes = async (req, res) => {
  try {
    const { jobDescriptionId } = req.params
    const shortlistedResumes = await Resume.find({
      jobDescriptionId,
      shortlisted: true,
      processed: true,
    }).sort({ matchScore: -1 })

    res.status(200).json({
      success: true,
      count: shortlistedResumes.length,
      data: shortlistedResumes,
    })
  } catch (err) {
    logger.error(`Get shortlisted resumes error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getJobApplicationStats = async (req, res) => {
  try {
    const { jobDescriptionId } = req.params

    // Get all processed resumes for this job
    const allResumes = await Resume.find({
      jobDescriptionId,
      processed: true,
    })

    // Calculate statistics
    const stats = {
      total: allResumes.length,
      shortlisted: allResumes.filter((r) => r.shortlisted).length,
      averageScore: 0,
      scoreDistribution: {
        '90-100': 0,
        '80-89': 0,
        '70-79': 0,
        '60-69': 0,
        below60: 0,
      },
    }

    // Calculate average score and distribution
    if (allResumes.length > 0) {
      const totalScore = allResumes.reduce((sum, resume) => sum + resume.matchScore, 0)
      stats.averageScore = Math.round(totalScore / allResumes.length)

      allResumes.forEach((resume) => {
        if (resume.matchScore >= 90) stats.scoreDistribution['90-100']++
        else if (resume.matchScore >= 80) stats.scoreDistribution['80-89']++
        else if (resume.matchScore >= 70) stats.scoreDistribution['70-79']++
        else if (resume.matchScore >= 60) stats.scoreDistribution['60-69']++
        else stats.scoreDistribution['below60']++
      })
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (err) {
    logger.error(`Get job application stats error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
