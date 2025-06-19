const multer = require('multer')
const path = require('path')
const fs = require('fs')
const logger = require('../utils/logger')

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname).toLowerCase()
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      return cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'))
    }
    cb(null, `resume-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    logger.warn(`Invalid file type rejected: ${file.originalname} (${file.mimetype})`)
    cb(new Error('Only PDF and Word documents are allowed'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
  },
})

module.exports = upload
