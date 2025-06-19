const express = require('express')
const router = express.Router()

// Valid job categories
const JOB_CATEGORIES = [
  {
    id: 'Cybersecurity',
    name: 'Cybersecurity Specialist',
    description: 'Information security and cybersecurity positions',
  },
  {
    id: 'Web Developer',
    name: 'Web Developer',
    description: 'Frontend, Backend, and Full Stack Development positions',
  },
  {
    id: 'UET Peshawar',
    name: 'Lecturer at UET Peshawar',
    description: 'Academic positions at University of Engineering and Technology, Peshawar',
  },
  {
    id: 'Python Developer',
    name: 'Python Developer',
    description: 'Python development and related technologies',
  },
  {
    id: 'Software Engineer',
    name: 'Software Engineer',
    description: 'General software engineering positions',
  },
]

// Get all job categories
router.get('/', (req, res) => {
  try {
    return res.json({ success: true, data: JOB_CATEGORIES })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Error fetching job categories', error: error.message })
  }
})

// Get job category by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const category = JOB_CATEGORIES.find((cat) => cat.id === id)

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: `Job category with ID ${id} not found` })
    }

    return res.json({ success: true, data: category })
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Error fetching job category', error: error.message })
  }
})

module.exports = router
