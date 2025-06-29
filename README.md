# AI-Driven Resume Screening Tool

An intelligent web application for automated resume screening against job descriptions using NLP and machine learning.

## Academic Context

This project is a Final Year Project (2024-2025) for the Bachelor's degree in Computer Science at the University of Engineering & Technology Peshawar, Jalozai Campus.

**Student Information:**

- **Name:** Silal Khan
- **Department:** Computer Science & IT
- **Institution:** UET Peshawar, Jalozai Campus
- **Project Duration:** 2024-2025 (Final Semester)

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
git clone <repository-url>
cd fyp-ai-resume-screening-tool

# Start all services
# On Windows
docker-start.bat

# On Linux/Mac
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# NLP API: http://localhost:5002
```

### Manual Setup

#### Backend (Node.js/Express)

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Or for production
npm start
```

#### NLP Service (Python/Flask)

```bash
cd nlp

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (use the fixed requirements file)
pip install -r requirements_fixed.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start Flask app
python app.py

# In a separate terminal, start Celery worker
# On Linux/Mac
celery -A celery_config worker --loglevel=info

# On Windows
celery -A celery_config worker --loglevel=info --pool=solo
```

#### Frontend (React)

```bash
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
- **NLP Service:** Python, Flask, spaCy, scikit-learn
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

## Contributing

This is an academic project developed as part of final year studies. While it's open for reference and educational purposes, please note that direct contributions might be limited during the academic evaluation period.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to:

- The faculty of CS & IT Department, UET Peshawar, Jalozai Campus
- Project supervisor(s) for their guidance
- Open source community for various tools and libraries used in this project
