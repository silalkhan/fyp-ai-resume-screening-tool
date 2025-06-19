const nodemailer = require('nodemailer')
const logger = require('./logger')

// Configure email transporter
let transporter

const configureTransporter = () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set')
      return false
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Verify connection
    return transporter.verify()
      .then(() => {
        logger.info('Email transporter configured successfully')
        return true
      })
      .catch((error) => {
        logger.error(`Email verification failed: ${error.message}`)
        return false
      })
  } catch (error) {
    logger.error(`Failed to configure email transporter: ${error.message}`)
    return false
  }
}

const sendShortlistNotification = async (email, candidateName, jobTitle, matchScore) => {
  if (!transporter && !configureTransporter()) {
    logger.error('Email transporter not configured')
    return false
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AI Resume Screening <noreply@airesumescreen.com>',
      to: email,
      subject: "You've Been Shortlisted!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Congratulations, ${candidateName || 'Candidate'}!</h2>
          <p>Your resume has been reviewed by our AI-driven screening system for the <strong>${jobTitle}</strong> position.</p>
          <p>We're pleased to inform you that your profile matched our requirements with a score of <strong>${matchScore}%</strong>, placing you in our shortlist for the next interview round.</p>
          <p>Our team will contact you shortly with more details about the next steps.</p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`Email notification sent to ${email}: ${info.messageId}`)
    return true
  } catch (error) {
    logger.error(`Failed to send email notification: ${error.message}`)
    return false
  }
}

module.exports = {
  sendShortlistNotification,
}
