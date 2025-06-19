/**
 * Email configuration
 */
module.exports = {
  // SMTP server settings
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',

  // Authentication
  user: process.env.EMAIL_USER || 'youremail@gmail.com',
  password: process.env.EMAIL_PASSWORD || 'yourapppassword',

  // Default sender info
  from: process.env.EMAIL_FROM || 'Resume Screening System <youremail@gmail.com>',
}
