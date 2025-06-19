const { validationResult } = require('express-validator')
const JobDescription = require('../models/JobDescription')
const logger = require('../utils/logger')

exports.createJobDescription = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const { title, category, description, requiredSkills, preferredSkills, requiredExperience } =
      req.body
    const jobDescription = new JobDescription({
      title,
      category,
      description,
      requiredSkills: requiredSkills || [],
      preferredSkills: preferredSkills || [],
      requiredExperience: requiredExperience || 0,
    })

    const savedJobDescription = await jobDescription.save()
    logger.info(`Job description created: ${savedJobDescription._id}`)

    res.status(201).json({
      success: true,
      message: 'Job description created successfully',
      data: savedJobDescription,
    })
  } catch (err) {
    logger.error(`Create job description error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getAllJobDescriptions = async (req, res) => {
  try {
    const { category } = req.query
    const query = category ? { category } : {}
    const jobDescriptions = await JobDescription.find(query).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: jobDescriptions.length, data: jobDescriptions })
  } catch (err) {
    logger.error(`Get all job descriptions error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getJobDescriptionById = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findById(req.params.id)
    if (!jobDescription) {
      logger.warn(`Job description not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Job description not found' })
    }
    res.status(200).json({ success: true, data: jobDescription })
  } catch (err) {
    logger.error(`Get job description error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.updateJobDescription = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const jobDescription = await JobDescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!jobDescription) {
      logger.warn(`Job description not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Job description not found' })
    }
    logger.info(`Job description updated: ${jobDescription._id}`)
    res.status(200).json({
      success: true,
      message: 'Job description updated successfully',
      data: jobDescription,
    })
  } catch (err) {
    logger.error(`Update job description error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.deleteJobDescription = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findByIdAndDelete(req.params.id)
    if (!jobDescription) {
      logger.warn(`Job description not found: ${req.params.id}`)
      return res.status(404).json({ success: false, message: 'Job description not found' })
    }
    logger.info(`Job description deleted: ${jobDescription._id}`)
    res.status(200).json({ success: true, message: 'Job description deleted successfully' })
  } catch (err) {
    logger.error(`Delete job description error: ${err.message}`)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
