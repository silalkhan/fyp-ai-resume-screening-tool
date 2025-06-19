const Resume = require('../models/Resume')
const JobDescription = require('../models/JobDescription')
const emailService = require('../services/emailService')

/**
 * Update a resume's shortlist status in the database
 * @param {string} resumeId - The ID of the resume to update
 * @param {boolean} shortlisted - Whether the resume is shortlisted
 */
async function updateResumeShortlistStatus(resumeId, shortlisted) {
  try {
    await Resume.findByIdAndUpdate(resumeId, {
      shortlisted,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error('Error updating resume shortlist status:', error)
    return false
  }
}

/**
 * Perform shortlisting for a specific job description
 * Candidates are shortlisted if:
 * 1. Their match score is >= 75%
 * 2. They are in the top 10 candidates
 *
 * @param {string} jobDescriptionId - The ID of the job description
 * @returns {Promise<Object>} Results of the shortlisting process
 */
async function performShortlisting(jobDescriptionId) {
  try {
    // Get all resumes for this job that have been processed
    const resumes = await Resume.find({
      jobDescriptionId: jobDescriptionId,
      processed: true,
    }).sort({ matchScore: -1 }) // Sort by match score, highest first

    if (!resumes || resumes.length === 0) {
      return {
        success: false,
        message: 'No processed resumes found for this job description',
      }
    }

    // Get job description details (for email)
    const jobDescription = await JobDescription.findById(jobDescriptionId)
    if (!jobDescription) {
      return {
        success: false,
        message: 'Job description not found',
      }
    }

    const shortlistedResumes = []
    const notShortlistedResumes = []
    const emailResults = []

    // Process each resume
    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i]

      // Determine if resume should be shortlisted
      // Shortlist if score >= 75% AND in the top 10
      const isShortlisted = resume.matchScore >= 75 && i < 10

      // Update resume status in database if needed
      if (resume.shortlisted !== isShortlisted) {
        await updateResumeShortlistStatus(resume._id, isShortlisted)
      }

      // Sort resumes into appropriate arrays
      if (isShortlisted) {
        shortlistedResumes.push(resume)

        // Send email notification if newly shortlisted
        if (!resume.shortlisted) {
          const emailResult = await emailService.sendShortlistEmail(resume, jobDescription)
          emailResults.push({
            resumeId: resume._id,
            candidateName: resume.candidateName || 'Unknown',
            emailSent: emailResult.success,
            ...emailResult,
          })
        }
      } else {
        notShortlistedResumes.push(resume)
      }
    }

    return {
      success: true,
      jobDescription: jobDescription.title,
      totalResumes: resumes.length,
      shortlistedCount: shortlistedResumes.length,
      notShortlistedCount: notShortlistedResumes.length,
      emailResults,
      shortlistedResumes: shortlistedResumes.map((r) => ({
        id: r._id,
        name: r.candidateName,
        score: r.matchScore,
      })),
    }
  } catch (error) {
    console.error('Error performing shortlisting:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Handle a newly processed resume by checking if shortlisting should occur
 * @param {Object} resume - The processed resume
 */
async function handleProcessedResume(resume) {
  try {
    const { jobDescriptionId } = resume

    // Check if this resume is eligible for shortlisting
    if (resume.matchScore >= 75) {
      // Get current number of shortlisted resumes
      const shortlistedCount = await Resume.countDocuments({
        jobDescriptionId,
        shortlisted: true,
      })

      // If less than 10, shortlist this resume
      if (shortlistedCount < 10) {
        await updateResumeShortlistStatus(resume._id, true)

        // Get job description (for email)
        const jobDescription = await JobDescription.findById(jobDescriptionId)

        // Send email notification
        if (jobDescription) {
          await emailService.sendShortlistEmail(resume, jobDescription)
        }

        return { shortlisted: true }
      }

      // If 10 or more, check if this score is higher than the lowest currently shortlisted
      const lowestShortlisted = await Resume.findOne({
        jobDescriptionId,
        shortlisted: true,
      })
        .sort({ matchScore: 1 })
        .limit(1)

      if (lowestShortlisted && resume.matchScore > lowestShortlisted.matchScore) {
        // Remove shortlisted status from lowest score
        await updateResumeShortlistStatus(lowestShortlisted._id, false)

        // Add shortlisted status to this resume
        await updateResumeShortlistStatus(resume._id, true)

        // Get job description (for email)
        const jobDescription = await JobDescription.findById(jobDescriptionId)

        // Send email notification
        if (jobDescription) {
          await emailService.sendShortlistEmail(resume, jobDescription)
        }

        return { shortlisted: true, replaced: lowestShortlisted._id }
      }
    }

    return { shortlisted: false }
  } catch (error) {
    console.error('Error handling processed resume:', error)
    return { error: error.message }
  }
}

module.exports = {
  performShortlisting,
  handleProcessedResume,
  updateResumeShortlistStatus,
}
