const express = require('express')
const { body, param, query } = require('express-validator')
const router = express.Router()
const jobDescriptionController = require('../controllers/jobDescriptionController')

// Define allowed categories
const VALID_CATEGORIES = [
  'Cybersecurity',
  'Web Developer',
  'UET Peshawar',
  'Python Developer',
  'Software Engineer',
]

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(VALID_CATEGORIES)
      .withMessage(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`),
    body('description').notEmpty().withMessage('Description is required'),
    body('requiredSkills').optional().isArray().withMessage('Required skills must be an array'),
    body('preferredSkills').optional().isArray().withMessage('Preferred skills must be an array'),
    body('requiredExperience').optional().isInt({ min: 0 }).withMessage('Invalid experience value'),
  ],
  jobDescriptionController.createJobDescription
)

router.get(
  '/',
  [
    query('category')
      .optional()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`),
  ],
  jobDescriptionController.getAllJobDescriptions
)

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid job description ID')],
  jobDescriptionController.getJobDescriptionById
)

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid job description ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('category')
      .optional()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('requiredSkills').optional().isArray().withMessage('Required skills must be an array'),
    body('preferredSkills').optional().isArray().withMessage('Preferred skills must be an array'),
    body('requiredExperience').optional().isInt({ min: 0 }).withMessage('Invalid experience value'),
  ],
  jobDescriptionController.updateJobDescription
)

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid job description ID')],
  jobDescriptionController.deleteJobDescription
)

module.exports = router
