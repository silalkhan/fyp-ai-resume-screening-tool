const nodemailer = require('nodemailer')
const config = require('../config/email')

/**
 * Configure mail transporter based on environment
 */
let transporter

// Check if in production or development
if (process.env.NODE_ENV === 'production') {
  // Production setup - use actual SMTP service
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })
} else {
  // Development setup - use ethereal for testing
  // This will be created on first use
  transporter = null
}

/**
 * Initialize transporter for development if needed
 */
async function initDevTransporter() {
  if (!transporter && process.env.NODE_ENV !== 'production') {
    // Create test account at Ethereal
    const testAccount = await nodemailer.createTestAccount()

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    console.log('Test email account created:', testAccount.user)
    console.log('View test emails at: https://ethereal.email/login')
    console.log('Username:', testAccount.user)
    console.log('Password:', testAccount.pass)
  }
}

/**
 * Send email to shortlisted candidate
 * @param {Object} resume Resume object containing candidate information
 * @param {Object} jobDescription Job description the candidate applied for
 * @returns {Promise} Email send result
 */
async function sendShortlistEmail(resume, jobDescription) {
  // Initialize development transporter if needed
  if (!transporter) {
    await initDevTransporter()
  }

  // Verify email exists for candidate
  if (!resume.contactInfo || !resume.contactInfo.email) {
    console.error('Cannot send email - no email address found for candidate')
    return { success: false, message: 'No email address provided' }
  }

  const mailOptions = {
    from: `"Resume Screening System" <${config.user}>`,
    to: resume.contactInfo.email,
    subject: "You've Been Shortlisted!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Congratulations, ${resume.candidateName || 'Candidate'}!</h1>
        
        <p>Your resume matches the job criteria for <strong>${jobDescription.title}</strong> 
        and you've been selected for the interview round.</p>
        
        <div style="background-color: #f2f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="font-size: 18px;">Your Match Score: <strong>${resume.matchScore}%</strong></p>
        </div>
        
        <p>Our recruitment team will contact you shortly with further details about 
        the interview process.</p>
        
        <p>Best regards,<br>
        The Recruitment Team</p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)

    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

module.exports = {
  sendShortlistEmail,
  initDevTransporter,
}
