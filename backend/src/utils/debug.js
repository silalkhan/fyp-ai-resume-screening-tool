const fs = require('fs')
const path = require('path')
const axios = require('axios')
const Resume = require('../models/Resume')
const FormData = require('form-data')
const mongoose = require('mongoose')

/**
 * Debug utility module for resume processing
 */
const debugUtil = {
  /**
   * Get full status of a resume processing task
   * @param {string} resumeId - Resume ID
   * @param {string} taskId - Task ID
   */
  async getResumeStatus(resumeId, taskId) {
    const result = {
      resumeId,
      taskId,
      resumeFound: false,
      resumeData: null,
      nlpStatus: null,
      fileExists: false,
      mongoStatus: null,
    }

    try {
      // Check MongoDB - handle different ID formats
      let resume = null

      // Try direct MongoDB ObjectId lookup if resumeId looks like one
      if (mongoose.Types.ObjectId.isValid(resumeId)) {
        resume = await Resume.findById(resumeId)
      }

      // If not found and taskId is provided, try finding by taskId
      if (!resume && taskId) {
        resume = await Resume.findOne({ taskId })
      }

      // Last resort, try finding by taskId = resumeId (when resumeId might be a UUID)
      if (!resume) {
        resume = await Resume.findOne({ taskId: resumeId })
      }

      result.resumeFound = !!resume

      if (resume) {
        const {
          processed,
          processing,
          processingError,
          matchScore,
          filePath,
          taskId: resumeTaskId,
        } = resume
        result.resumeData = {
          processed,
          processing,
          processingError,
          matchScore,
          fileExists: !!filePath,
          hasTaskId: !!resumeTaskId,
        }

        // Check physical file
        if (resume.filePath) {
          result.fileExists = fs.existsSync(resume.filePath)
        }

        // Set task ID from database if not provided
        if (!taskId && resume.taskId) {
          taskId = resume.taskId
          result.taskId = taskId
        }
      }

      // Check NLP service for task status
      if (taskId) {
        try {
          const nlpApiClient = axios.create({
            baseURL: process.env.NLP_API_URL || 'http://localhost:5002',
            timeout: 10000,
          })

          const response = await nlpApiClient.get(`/api/task/${taskId}`)
          result.nlpStatus = response.data
        } catch (nlpError) {
          result.nlpError = {
            message: nlpError.message,
            status: nlpError.response?.status,
            data: nlpError.response?.data,
          }
        }
      }

      // Check MongoDB status
      result.mongoStatus = 'connected'

      return result
    } catch (error) {
      return {
        ...result,
        error: error.message,
        stack: error.stack,
      }
    }
  },

  /**
   * Fix a stalled resume by reprocessing it
   * @param {string} resumeId - Resume ID
   */
  async fixStalledResume(resumeId) {
    try {
      // Find resume - handle different ID formats
      let resume = null

      // Try direct MongoDB ObjectId lookup if resumeId looks like one
      if (mongoose.Types.ObjectId.isValid(resumeId)) {
        resume = await Resume.findById(resumeId)
      }

      // If not found, try finding by taskId = resumeId (when resumeId might be a UUID)
      if (!resume) {
        resume = await Resume.findOne({ taskId: resumeId })
      }

      if (!resume) {
        return { success: false, message: 'Resume not found' }
      }

      // Check if resume is actually stalled
      if (resume.processed) {
        return {
          success: false,
          message: 'Resume is already processed',
          resume: {
            processed: resume.processed,
            processing: resume.processing,
            processingError: resume.processingError,
            matchScore: resume.matchScore,
          },
        }
      }

      if (!resume.jobDescriptionId) {
        return { success: false, message: 'Resume has no job description ID' }
      }

      // Check if file exists
      if (!resume.filePath || !fs.existsSync(resume.filePath)) {
        return { success: false, message: 'Resume file not found' }
      }

      // Reset processing status
      await Resume.findByIdAndUpdate(resume._id, {
        processing: false,
        processed: false,
        processingError: null,
      })

      return {
        success: true,
        message: 'Resume reset for reprocessing',
        resume: await Resume.findById(resume._id),
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
        error: error.stack,
      }
    }
  },

  /**
   * Force reprocess a resume by sending it directly to the NLP service
   * @param {string} resumeId - Resume ID
   */
  async forceReprocessResume(resumeId) {
    try {
      // Find resume - handle different ID formats
      let resume = null

      // Try direct MongoDB ObjectId lookup if resumeId looks like one
      if (mongoose.Types.ObjectId.isValid(resumeId)) {
        resume = await Resume.findById(resumeId)
      }

      // If not found, try finding by taskId = resumeId (when resumeId might be a UUID)
      if (!resume) {
        resume = await Resume.findOne({ taskId: resumeId })
      }

      if (!resume) {
        return { success: false, message: 'Resume not found' }
      }

      // Check if file exists
      if (!resume.filePath || !fs.existsSync(resume.filePath)) {
        return { success: false, message: 'Resume file not found' }
      }

      // Get job description
      const JobDescription = require('../models/JobDescription')
      const job = await JobDescription.findById(resume.jobDescriptionId)
      if (!job) {
        return { success: false, message: 'Job description not found' }
      }

      // Create form data
      const formData = new FormData()
      formData.append('resume', fs.createReadStream(resume.filePath))
      formData.append('jobDescription', job.description)
      formData.append('jobCategory', job.category)

      if (job.requiredSkills && job.requiredSkills.length > 0) {
        formData.append('requiredSkills', job.requiredSkills.join(','))
      }

      // Send to NLP service
      const nlpApiClient = axios.create({
        baseURL: process.env.NLP_API_URL || 'http://localhost:5002',
        timeout: 30000,
      })

      const response = await nlpApiClient.post('/api/process', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })

      // Update resume with new task ID
      if (response.data && response.data.taskId) {
        await Resume.findByIdAndUpdate(resume._id, {
          taskId: response.data.taskId,
          processing: true,
          processed: false,
          processingError: null,
        })
      }

      return {
        success: true,
        message: 'Resume reprocessing started',
        nlpResponse: response.data,
        resume: await Resume.findById(resume._id),
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
        error: error.stack,
      }
    }
  },
}

module.exports = debugUtil
