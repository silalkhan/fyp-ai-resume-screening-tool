const mongoose = require('mongoose')

const JobDescriptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'Cybersecurity',
      'Web Developer',
      'UET Peshawar',
      'Python Developer',
      'Software Engineer',
    ],
    required: true,
  },
  description: { type: String, required: true },
  requiredSkills: { type: [String], default: [] },
  preferredSkills: { type: [String], default: [] },
  requiredExperience: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

JobDescriptionSchema.index({ title: 1 })
JobDescriptionSchema.index({ category: 1 })
JobDescriptionSchema.index({ createdAt: -1 })

module.exports = mongoose.model('JobDescription', JobDescriptionSchema)
