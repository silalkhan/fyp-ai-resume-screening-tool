const mongoose = require('mongoose')

const ResumeSchema = new mongoose.Schema(
  {
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    candidateName: { type: String, default: '' },
    contactInfo: {
      email: { type: String },
      phone: { type: String },
      linkedin: { type: String },
      address: { type: String },
      website: { type: String },
    },
    processed: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    processingError: { type: String },
    taskId: { type: String },
    jobDescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription' },
    jobCategory: { type: String },
    processedData: {
      skills: [{ type: String }],
      experience: [
        {
          company: String,
          position: String,
          duration: String,
          description: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          year: String,
        },
      ],
      projects: [
        {
          title: String,
          description: String,
          technologies: [String],
          duration: String,
        },
      ],
    },
    matchScore: { type: Number, default: 0 },
    shortlisted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Indexes for faster queries
ResumeSchema.index({ jobDescriptionId: 1, matchScore: -1 })
ResumeSchema.index({ processed: 1, processing: 1 })
ResumeSchema.index({ shortlisted: 1 })
ResumeSchema.index({ uploadDate: -1 })

module.exports = mongoose.model('Resume', ResumeSchema)
