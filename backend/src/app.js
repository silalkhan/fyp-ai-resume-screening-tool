const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const path = require('path')
const rateLimit = require('express-rate-limit')
const multer = require('multer')
const connectDB = require('./config/db')
const resumeRoutes = require('./routes/resumeRoutes')
const jobDescriptionRoutes = require('./routes/jobDescriptionRoutes')
const jobCategoryRoutes = require('./routes/jobCategoryRoutes')
const logger = require('./utils/logger')

require('dotenv').config()

const app = express()

connectDB()

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: { success: false, message: 'Too many requests, please try again later' },
})

app.use(limiter)
app.use(cors())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../Uploads')))

app.use('/api/resumes', resumeRoutes)
app.use('/api/job-descriptions', jobDescriptionRoutes)
app.use('/api/job-categories', jobCategoryRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI-Driven Resume Screening Tool API' })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    version: '1.0',
    timestamp: new Date().toISOString(),
  })
})

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error(`Multer error: ${err.message}`)
    return res.status(400).json({ success: false, message: err.message })
  }
  logger.error(`Server error: ${err.message}`)
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  })
})

module.exports = app
