const mongoose = require('mongoose')
require('dotenv').config({ path: '../.env' })

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resume-screening')
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Import Job Description model
const JobDescription = require('../src/models/JobDescription')

// Job descriptions data with required skills and categories
const jobDescriptions = [
  {
    title: 'Cybersecurity Specialist',
    category: 'Cybersecurity',
    description:
      "We are seeking a skilled Cybersecurity Specialist to manage, monitor, and improve our organization's security posture. Knowledge in firewalls, intrusion detection, and ethical hacking is required.",
    requiredSkills: [
      'Network Security',
      'Firewall Configuration',
      'Penetration Testing',
      'Security Auditing',
      'SIEM',
    ],
    preferredSkills: ['CISSP', 'CEH', 'OSCP', 'Python Scripting', 'Incident Response'],
    requiredExperience: 2,
    createdAt: new Date(),
  },
  {
    title: 'Full Stack Web Developer',
    category: 'Web Developer',
    description:
      'Looking for a developer experienced in both frontend and backend technologies (React.js, Node.js, MongoDB) to build scalable web applications.',
    requiredSkills: ['JavaScript', 'React.js', 'Node.js', 'HTML', 'CSS', 'MongoDB'],
    preferredSkills: ['TypeScript', 'AWS', 'Docker', 'Redis', 'GraphQL'],
    requiredExperience: 3,
    createdAt: new Date(),
  },
  {
    title: 'Lecturer at UET Peshawar',
    category: 'UET Peshawar',
    description:
      'The candidate must have an MS or PhD in Computer Science or Engineering with proven teaching and research experience. Strong communication skills are essential.',
    requiredSkills: [
      'Teaching',
      'Research',
      'MS/PhD Degree',
      'Academic Publications',
      'Curriculum Development',
    ],
    preferredSkills: [
      'Industry Experience',
      'Project Supervision',
      'Grant Writing',
      'Conference Presentations',
    ],
    requiredExperience: 2,
    createdAt: new Date(),
  },
  {
    title: 'Python Developer',
    category: 'Python Developer',
    description:
      'Hiring a Python Developer with experience in building APIs, working with data, and applying ML or automation solutions using Python frameworks.',
    requiredSkills: ['Python', 'Flask/Django', 'API Development', 'SQL', 'Git'],
    preferredSkills: ['Machine Learning', 'Data Analysis', 'Docker', 'CI/CD', 'AWS/Azure'],
    requiredExperience: 2,
    createdAt: new Date(),
  },
  {
    title: 'Software Engineer',
    category: 'Software Engineer',
    description:
      'Software Engineer required for designing, developing, and deploying software systems. Candidates must be proficient in at least one OOP language and SDLC practices.',
    requiredSkills: ['OOP', 'Data Structures', 'Algorithms', 'Git', 'Testing'],
    preferredSkills: ['Java', 'C#', 'Cloud Services', 'Agile', 'Microservices'],
    requiredExperience: 1,
    createdAt: new Date(),
  },
]

// Function to seed the data
const seedData = async () => {
  try {
    // Delete existing job descriptions
    await JobDescription.deleteMany({})
    console.log('Existing job descriptions deleted')

    // Insert new job descriptions
    await JobDescription.insertMany(jobDescriptions)
    console.log('Job descriptions successfully seeded!')

    // Close the connection
    mongoose.connection.close()
  } catch (error) {
    console.error('Error seeding job descriptions:', error)
    mongoose.connection.close()
  }
}

// Run the seeding function
seedData()
