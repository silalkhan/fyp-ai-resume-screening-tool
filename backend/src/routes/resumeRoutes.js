const express = require('express')
const { body, param, query } = require('express-validator')
const router = express.Router()
const resumeController = require('../controllers/resumeController')
const upload = require('../middleware/upload')
const debugUtil = require('../utils/debug')

// Routes with specific prefixes need to come BEFORE routes with path parameters
// to avoid conflicts with the Express router

// Fix endpoint (needs to be at the top to avoid conflicts with /:id routes)
router.post('/fix/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params
    const { force } = req.body

    let result
    if (force) {
      result = await debugUtil.forceReprocessResume(resumeId)
    } else {
      result = await debugUtil.fixStalledResume(resumeId)
    }

    res.json(result)
  } catch (error) {
    console.error('Fix endpoint error:', error)
    res.status(500).json({
      success: false,
      message: 'Error in fix endpoint',
      error: error.message,
    })
  }
})

// Debug endpoint (needs to be at the top to avoid conflicts with /:id routes)
router.get('/debug/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params
    const { taskId } = req.query

    const result = await debugUtil.getResumeStatus(resumeId, taskId)
    res.json(result)
  } catch (error) {
    console.error('Debug endpoint error:', error)
    res.status(500).json({
      success: false,
      message: 'Error in debug endpoint',
      error: error.message,
    })
  }
})

// Task status route (needs to be at the top to avoid conflicts with /:id routes)
router.get(
  '/task/:taskId/status',
  [param('taskId').notEmpty().withMessage('Task ID is required')],
  resumeController.checkTaskStatus
)

// Shortlisted route (needs to be at the top to avoid conflicts with /:id routes)
router.get(
  '/shortlisted/:jobDescriptionId',
  [param('jobDescriptionId').isMongoId().withMessage('Invalid job description ID')],
  resumeController.getShortlistedResumes
)

// Stats route (needs to be at the top to avoid conflicts with /:id routes)
router.get(
  '/stats/:jobDescriptionId',
  [param('jobDescriptionId').isMongoId().withMessage('Invalid job description ID')],
  resumeController.getJobApplicationStats
)

// Upload resumes
router.post(
  '/upload',
  upload.single('resume'),
  [body('jobDescriptionId').isMongoId().withMessage('Invalid job description ID')],
  resumeController.uploadResume
)

// Get all resumes
router.get(
  '/',
  [query('jobDescriptionId').optional().isMongoId().withMessage('Invalid job description ID')],
  resumeController.getAllResumes
)

// Get resume by ID (will only match MongoDB ObjectIds due to validation)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid resume ID')],
  resumeController.getResumeById
)

// Delete resume
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid resume ID')],
  resumeController.deleteResume
)

// Process resume
router.post(
  '/:id/process',
  [
    param('id').isMongoId().withMessage('Invalid resume ID'),
    body('jobDescriptionId').isMongoId().withMessage('Invalid job description ID'),
  ],
  resumeController.processResumeWithAI
)

// Compare resume to job
router.post(
  '/:resumeId/compare/:jobDescriptionId',
  [
    param('resumeId').isMongoId().withMessage('Invalid resume ID'),
    param('jobDescriptionId').isMongoId().withMessage('Invalid job description ID'),
  ],
  resumeController.compareResumeToJob
)

// Detect duplicates
router.get(
  '/:id/detect-duplicates',
  [param('id').isMongoId().withMessage('Invalid resume ID')],
  resumeController.detectDuplicates
)

module.exports = router
