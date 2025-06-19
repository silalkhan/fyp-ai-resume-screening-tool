const express = require('express')
const { body, param, query } = require('express-validator')
const router = express.Router()
const resumeController = require('../controllers/resumeController')
const upload = require('../middleware/upload')

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

module.exports = router
