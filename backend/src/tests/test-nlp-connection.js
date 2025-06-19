/**
 * Test script to verify connection between Node.js backend and Python NLP service
 *
 * Usage:
 * 1. Start the NLP service: cd nlp && python app.py
 * 2. In another terminal: cd backend && node src/tests/test-nlp-connection.js
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5002'

// Test sample job descriptions
const jobDescriptions = {
  'Software Engineer':
    'We are looking for an experienced Software Engineer proficient in JavaScript, Python, and cloud technologies. ' +
    'The ideal candidate should have experience with modern web frameworks, RESTful APIs, and database design.',

  'Cybersecurity Specialist':
    'Seeking a Cybersecurity Specialist with experience in network security, threat detection, and vulnerability assessment. ' +
    'Knowledge of security protocols, firewalls, and encryption technologies is required.',

  'UET Peshawar Lectureship':
    'The University of Engineering and Technology Peshawar is seeking lecturers with PhD or Masters degrees ' +
    'in Computer Science or related fields. Candidates should have teaching experience, research publications, ' +
    'and strong academic credentials. The position involves teaching undergraduate and graduate courses, ' +
    'conducting research, and supervising student projects.',
}

async function testNLPConnection() {
  try {
    console.log('Testing connection to NLP service...')

    // Basic connectivity test
    const pingResponse = await axios.get(`${PYTHON_API_URL}/`)
    console.log('✅ NLP service is running:', pingResponse.data)

    console.log('\nTesting job description categories with sample resume...')

    // Find a sample PDF in the uploads folder or use a test file
    const uploadsDir = path.join(__dirname, '../../uploads')
    let testFilePath

    try {
      // Try to find a PDF file in the uploads directory
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir).filter((file) => file.endsWith('.pdf'))
        if (files.length > 0) {
          testFilePath = path.join(uploadsDir, files[0])
          console.log(`Using existing resume from uploads: ${files[0]}`)
        }
      }
    } catch (error) {
      console.warn('Could not access uploads directory:', error.message)
    }

    // If no file found, use the test file path
    if (!testFilePath) {
      testFilePath = path.join(__dirname, 'test-resume.pdf')
      console.log(
        'No resume found in uploads directory. Please ensure there is a test-resume.pdf file in the tests directory.'
      )
      if (!fs.existsSync(testFilePath)) {
        console.error('❌ Test file not found:', testFilePath)
        console.log('Please add a test PDF resume to the tests directory.')
        return
      }
    }

    // Test each job type
    for (const [jobType, description] of Object.entries(jobDescriptions)) {
      console.log(`\n==== Testing with ${jobType} job description ====`)

      const formData = new FormData()
      formData.append('resume', fs.createReadStream(testFilePath))
      formData.append('jobDescription', description)

      // Add appropriate skills based on job type
      let skills = []
      if (jobType === 'Software Engineer') {
        skills = ['javascript', 'python', 'react', 'node.js', 'mongodb']
      } else if (jobType === 'Cybersecurity Specialist') {
        skills = ['security', 'firewall', 'encryption', 'threat detection', 'penetration testing']
      } else if (jobType === 'UET Peshawar Lectureship') {
        skills = ['teaching', 'research', 'phd', 'academic', 'curriculum development']
      }

      formData.append('requiredSkills', skills.join(','))

      console.log(`Sending resume with ${jobType} description and ${skills.length} skills...`)

      const response = await axios.post(`${PYTHON_API_URL}/api/process`, formData, {
        headers: { ...formData.getHeaders() },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })

      if (response.data.success) {
        console.log(`✅ Resume processing started successfully for ${jobType}`)
        console.log('Task ID:', response.data.taskId)

        // Poll for task completion
        let taskCompleted = false
        let attempt = 0
        const maxAttempts = 20

        while (!taskCompleted && attempt < maxAttempts) {
          attempt++
          await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second

          const taskResponse = await axios.get(`${PYTHON_API_URL}/api/task/${response.data.taskId}`)

          if (taskResponse.data.status === 'completed') {
            taskCompleted = true
            console.log(`✅ Processing completed for ${jobType}:`)
            console.log('Match Score:', taskResponse.data.result.data.matchScore)
            console.log('Skills found:', taskResponse.data.result.data.skills.length)
            console.log('Education entries:', taskResponse.data.result.data.education.length)
            console.log('Experience entries:', taskResponse.data.result.data.experience.length)
          } else if (taskResponse.data.status === 'failed') {
            console.error(`❌ Task failed for ${jobType}:`, taskResponse.data.error)
            break
          } else {
            process.stdout.write('.')
          }
        }

        if (!taskCompleted) {
          console.log(`\n⚠️ Task did not complete within ${maxAttempts} seconds for ${jobType}`)
        }
      } else {
        console.error(`❌ Failed to start processing for ${jobType}:`, response.data.message)
      }
    }
  } catch (error) {
    console.error('❌ Connection test failed:')
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    } else if (error.request) {
      console.error('No response received. Is the NLP service running?')
    } else {
      console.error('Error setting up the request:', error.message)
    }
  }
}

testNLPConnection()
  .then(() => {
    console.log('\nTest completed.')
  })
  .catch((error) => {
    console.error('Unhandled error during test:', error)
  })
