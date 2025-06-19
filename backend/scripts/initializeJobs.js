require('dotenv').config()
const mongoose = require('mongoose')
const { initializeJobData } = require('../src/utils/initJobData')
const logger = require('../src/utils/logger')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    logger.info('MongoDB Connected')
    return true
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`)
    return false
  }
}

const main = async () => {
  if (await connectDB()) {
    try {
      const jobs = await initializeJobData()
      logger.info('Job descriptions initialized successfully')
      jobs.forEach((job) => {
        logger.info(`Created job: ${job.title} (${job.category})`)
      })
    } catch (error) {
      logger.error(`Failed to initialize jobs: ${error.message}`)
    } finally {
      await mongoose.disconnect()
    }
  }
}

main()
