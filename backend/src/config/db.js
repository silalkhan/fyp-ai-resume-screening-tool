const mongoose = require('mongoose')
const logger = require('../utils/logger')

const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

const connectWithRetry = async (retryCount = 0) => {
  try {
    const mongoURI = process.env.MONGO_URI

    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in .env')
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    logger.info(`MongoDB Connected: ${mongoose.connection.host}`)

    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      logger.error('MongoDB disconnected. Attempting to reconnect...')

      setTimeout(() => {
        connectWithRetry(0)
      }, RETRY_DELAY)
    })

    // Handle connection errors
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`)
    })

    return true
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`)

    if (retryCount < MAX_RETRIES) {
      logger.info(
        `Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`
      )

      await new Promise((resolve) => {
        setTimeout(resolve, RETRY_DELAY)
      })

      return connectWithRetry(retryCount + 1)
    }

    logger.error('Max connection retries reached. Exiting...')
    process.exit(1)
  }
}

module.exports = connectWithRetry