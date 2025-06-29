const express = require('express')
const { body, param, query } = require('express-validator')
const router = express.Router()
const resumeController = require('../controllers/resumeController')
const upload = require('../middleware/upload')
const debugUtil = require('../utils/debug')

router.post(
  '/upload',
  upload.single('resume'),
  [body('jobDescriptionId').isMongoId().withMessage('Invalid job description ID')],
  resumeController.uploadResume
)

router.get(
  '/',
  [query('jobDescriptionId').optional().isMongoId().withMessage('Invalid job description ID')],
  resumeController.getAllResumes
)

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid resume ID')],
  resumeController.getResumeById
)

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid resume ID')],
  resumeController.deleteResume
)

router.post(
  '/:id/process',
  [
    param('id').isMongoId().withMessage('Invalid resume ID'),
    body('jobDescriptionId').isMongoId().withMessage('Invalid job description ID'),
  ],
  resumeController.processResumeWithAI
)

router.post(
  '/:resumeId/compare/:jobDescriptionId',
  [
    param('resumeId').isMongoId().withMessage('Invalid resume ID'),
    param('jobDescriptionId').isMongoId().withMessage('Invalid job description ID'),
  ],
  resumeController.compareResumeToJob
)

router.get(
  '/shortlisted/:jobDescriptionId',
  [param('jobDescriptionId').isMongoId().withMessage('Invalid job description ID')],
  resumeController.getShortlistedResumes
)

router.get(
  '/stats/:jobDescriptionId',
  [param('jobDescriptionId').isMongoId().withMessage('Invalid job description ID')],
  resumeController.getJobApplicationStats
)

router.get(
  '/:id/detect-duplicates',
  [param('id').isMongoId().withMessage('Invalid resume ID')],
  resumeController.detectDuplicates
)

// Add debug endpoint
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

// Add fix endpoint
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

module.exports = router
