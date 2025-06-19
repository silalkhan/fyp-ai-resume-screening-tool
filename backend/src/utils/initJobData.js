const JobDescription = require('../models/JobDescription')
const logger = require('./logger')

const jobDescriptions = [
  {
    title: 'Cybersecurity Analyst',
    category: 'Cybersecurity',
    description: `We are seeking a skilled Cybersecurity Analyst to join our team. The ideal candidate will be responsible for protecting our systems and data from cyber threats.

Key Responsibilities:
- Monitor security systems and networks
- Conduct vulnerability assessments and penetration testing
- Implement security measures and controls
- Respond to security incidents and breaches
- Maintain security documentation and procedures

Requirements:
- Bachelor's degree in Computer Science, Cybersecurity, or related field
- Knowledge of network security, encryption, and security protocols
- Experience with security tools and frameworks
- Understanding of compliance requirements (ISO 27001, GDPR)`,
    requiredSkills: [
      'Network Security',
      'Penetration Testing',
      'Security Information and Event Management (SIEM)',
      'Incident Response',
      'Vulnerability Assessment',
      'Security Protocols',
    ],
    preferredSkills: [
      'CISSP Certification',
      'Python Scripting',
      'Cloud Security',
      'Firewall Management',
      'Risk Assessment',
    ],
    requiredExperience: 3,
  },
  {
    title: 'Full Stack Web Developer',
    category: 'Web Developer',
    description: `We're looking for a Full Stack Web Developer proficient in modern web technologies.

Key Responsibilities:
- Develop and maintain web applications
- Work with both frontend and backend technologies
- Implement responsive design principles
- Optimize applications for performance
- Write clean, maintainable code

Requirements:
- Strong proficiency in JavaScript/TypeScript
- Experience with React.js and Node.js
- Understanding of database design and ORM
- Knowledge of web security best practices`,
    requiredSkills: ['JavaScript', 'React.js', 'Node.js', 'MongoDB', 'HTML5', 'CSS3', 'REST API'],
    preferredSkills: ['TypeScript', 'AWS', 'Docker', 'GraphQL', 'Redis', 'CI/CD'],
    requiredExperience: 2,
  },
  {
    title: 'Assistant Professor - Computer Science',
    category: 'Lecturer',
    description: `The University of Engineering and Technology, Peshawar is seeking applications for the position of Assistant Professor in the Department of Computer Science.

Key Responsibilities:
- Teach undergraduate and graduate courses
- Conduct research and publish scholarly work
- Supervise student projects and theses
- Participate in curriculum development
- Contribute to departmental activities

Requirements:
- PhD in Computer Science or related field
- Research publications in recognized journals
- Teaching experience at university level
- Strong academic background`,
    requiredSkills: [
      'Computer Science',
      'Academic Research',
      'Teaching',
      'Research Publications',
      'Curriculum Development',
      'Project Supervision',
    ],
    preferredSkills: [
      'Grant Writing',
      'Conference Publications',
      'Industry Experience',
      'Academic Administration',
      'Research Methodology',
    ],
    requiredExperience: 3,
  },
  {
    title: 'Python Developer',
    category: 'Python Developer',
    description: `We are looking for a Python Developer to join our data engineering team.

Key Responsibilities:
- Develop and maintain Python applications
- Work with data processing pipelines
- Implement machine learning models
- Write efficient and scalable code
- Collaborate with data scientists

Requirements:
- Strong Python programming skills
- Experience with data processing
- Knowledge of SQL and databases
- Understanding of ML concepts`,
    requiredSkills: ['Python', 'SQL', 'Data Processing', 'API Development', 'Unit Testing', 'Git'],
    preferredSkills: ['Machine Learning', 'pandas', 'NumPy', 'Docker', 'FastAPI', 'AWS'],
    requiredExperience: 2,
  },
  {
    title: 'Software Engineer',
    category: 'Software Engineer',
    description: `Looking for a Software Engineer to develop and maintain enterprise applications.

Key Responsibilities:
- Design and implement software solutions
- Write clean, efficient code
- Troubleshoot and debug applications
- Collaborate with cross-functional teams
- Participate in code reviews

Requirements:
- Bachelor's degree in Computer Science or related field
- Strong programming fundamentals
- Experience with software development lifecycle
- Knowledge of design patterns and best practices`,
    requiredSkills: ['Java', 'Spring Boot', 'JavaScript', 'SQL', 'Git', 'REST APIs'],
    preferredSkills: ['Microservices', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Testing'],
    requiredExperience: 3,
  },
]

const initializeJobData = async () => {
  try {
    // Clear existing job descriptions
    await JobDescription.deleteMany({})
    logger.info('Cleared existing job descriptions')

    // Insert new job descriptions
    const createdJobs = await JobDescription.insertMany(jobDescriptions)
    logger.info(`Created ${createdJobs.length} job descriptions`)

    return createdJobs
  } catch (error) {
    logger.error(`Failed to initialize job data: ${error.message}`)
    throw error
  }
}

module.exports = { initializeJobData }
