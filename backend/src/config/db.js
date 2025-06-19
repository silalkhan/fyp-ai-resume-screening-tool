const mongoose = require('mongoose')
const logger = require('../utils/logger')

const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

const connectWithRetry = async (retryCount = 0) => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/resume-screening'
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    })

    logger.info(`MongoDB Connected: ${mongoose.connection.host}`)
    
    // Handle disconnection events
    mongoose.connection.on('disconnected', () => {
      logger.error('MongoDB disconnected. Attempting to reconnect...')
      setTimeout(() => connectWithRetry(0), RETRY_DELAY)
    })

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`)
    })

    return true
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`)
    
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return connectWithRetry(retryCount + 1)
    } else {
      logger.error('Max connection retries reached. Exiting...')
      process.exit(1)
    }
  }
}

module.exports = connectWithRetry
