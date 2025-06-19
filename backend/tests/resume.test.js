const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const JobDescription = require('../src/models/JobDescription')

beforeAll(async () => {
  await connectDB()
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe('Resume API', () => {
  let jobId

  beforeEach(async () => {
    const job = await JobDescription.create({
      title: 'Software Engineer',
      category: 'Software Engineer',
      description: 'Develop software solutions.',
      requiredSkills: ['javascript'],
    })
    jobId = job._id
  })

  afterEach(async () => {
    await JobDescription.deleteMany({})
  })

  it('should return welcome message on root route', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Welcome to AI-Driven Resume Screening Tool API')
  })

  it('should reject invalid job description ID', async () => {
    const res = await request(app)
      .post('/api/resumes/upload')
      .field('jobDescriptionId', 'invalid')
      .attach('resume', Buffer.from('test'), 'test.pdf')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
