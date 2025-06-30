# AI-Driven Resume Screening Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)

An intelligent web application for automated resume screening against job descriptions using NLP and machine learning.

![Demo Screenshot](https://raw.githubusercontent.com/silalkhan/fyp-ai-resume-screening-tool/main/frontend/public/logo192.png)

## Academic Context

This project is a Final Year Project for the Bachelor's degree in Computer Science at the University of Engineering & Technology Peshawar, Jalozai Campus.

**Student Information:**

- **Name:** Silal Khan
- **Department:** Computer Science & IT
- **Institution:** UET Peshawar, Jalozai Campus
- **Batch:** 2021-2025
- **Project Duration:** Final Year (8th Semester)

## Project Overview

This intelligent system automates the resume screening process by:

- Analyzing resumes using Natural Language Processing (NLP)
- Matching candidates with job descriptions using ML algorithms
- Providing detailed scoring and ranking of candidates
- Streamlining the recruitment process through automation

## System Architecture

This project consists of three main components:

1. **React Frontend**

   - Modern UI for uploading resumes and managing job descriptions
   - Interactive dashboard for viewing results
   - Real-time processing status updates

2. **Node.js Backend**

   - Express API for data persistence and business logic
   - MongoDB integration for data storage
   - RESTful API endpoints for frontend communication

3. **Python NLP Service**
   - Flask microservice with ML capabilities
   - Advanced NLP algorithms for text processing
   - Celery task queue for asynchronous processing

## Quick Start

### Using Docker (Recommended)

The easiest way to run the system is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/silalkhan/fyp-ai-resume-screening-tool.git
cd fyp-ai-resume-screening-tool

# Start all services
# On Windows
docker-start.bat

# On Linux/Mac
sh start-services.sh

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# NLP API: http://localhost:5002
```

### One-Click Startup (All Services)

```bash
# Navigate to project root
cd fyp-ai-resume-screening-tool

# Run the startup script
./start-services.sh
```

### Manual Setup (Step by Step)

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# To seed the database with sample job descriptions (first time setup)
node scripts/seed-job-descriptions.js
```

#### 2. Redis Setup (Required for NLP Service)

```bash
# For Linux
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return "PONG"

# For Windows (using WSL)
wsl redis-cli ping
```

#### 3. NLP Service Setup

**Method 1: Using Virtual Environment**

```bash
# Navigate to NLP directory
cd nlp

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install scikit-learn sentence-transformers spacy celery
python -m spacy download en_core_web_lg

# Start Flask app
python app.py
```

**Method 2: Using Start Script**

```bash
# Navigate to NLP directory
cd nlp

# Run the startup script
./start_services.sh
```

**Method 3: Manual Component Start (Windows)**

```bash
# Kill any existing Python processes if needed
taskkill /IM python.exe /F

# Start Flask app
cd nlp && export FLASK_ENV=development && python app.py

# In a separate terminal, start Celery worker
cd nlp && celery -A celery_config worker --loglevel=DEBUG -P solo
```

#### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Key Features

- **Resume Processing**

  - Upload and parse resumes in PDF and DOCX formats
  - Extract key information (skills, education, experience)
  - Generate structured data from unstructured text

- **Job Description Management**

  - Create and manage job descriptions by category
  - Define required skills and qualifications
  - Set weightage for different criteria

- **Intelligent Matching**

  - ML-based scoring system
  - Skills and experience mapping
  - Education qualification matching
  - Overall candidate ranking

- **User Interface**
  - Modern, responsive design
  - Interactive dashboards
  - Real-time processing status
  - Detailed result visualization

## Technical Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **NLP Service:** Python, Flask, spaCy, scikit-learn, Sentence-Transformers
- **Infrastructure:** Docker, Redis, Celery

## Environment Setup

### Required Environment Variables

Backend (.env):

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/resume-screening
NLP_API_URL=http://localhost:5002/api
```

Frontend (.env):

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NLP_API_URL=http://localhost:5002/api
```

NLP Service (.env):

```
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Troubleshooting

- **Backend Issues**: Ensure MongoDB is running and accessible
- **NLP Service Issues**: Verify Redis is running with `redis-cli ping`
- **Frontend Issues**: Check if backend and NLP services are accessible
- **Celery Worker**: If tasks are not processing, restart the Celery worker

## Contributing

This is an academic project developed as part of final year studies. While it's open for reference and educational purposes, please note that direct contributions might be limited during the academic evaluation period.

If you'd like to contribute, please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to:

- The faculty of CS & IT Department, UET Peshawar, Jalozai Campus
- Project supervisor(s) for their guidance
- Open source community for various tools and libraries used in this project

## Contact

Silal Khan - [@silalkhan](https://github.com/silalkhan) - silalnoor999@gmail.com

Project Link: [https://github.com/silalkhan/fyp-ai-resume-screening-tool](https://github.com/silalkhan/fyp-ai-resume-screening-tool)
