# AI-Driven Resume Screening Tool

An intelligent web application for automated resume screening against job descriptions using NLP and machine learning.

## Fixed Issues

The following issues have been fixed to make the application runnable:

1. **Dependency Versions**: Updated package.json files in both frontend and backend to use compatible dependency versions.
2. **Docker Configuration**: Created missing Dockerfile files for all three services.
3. **Windows Compatibility**: Added Windows batch scripts for starting the services.
4. **Python Dependencies**: Fixed the requirements_fixed.txt file with specific versions to ensure compatibility.

## System Overview

This project consists of three main components:

1. **React Frontend** - Modern UI for uploading resumes and managing job descriptions
2. **Node.js Backend** - Express API for data persistence and business logic
3. **Python NLP Service** - Flask microservice with ML capabilities for resume analysis

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

### Using Start Scripts

For a quick start without Docker:

```bash
# On Windows
start-services.bat

# On Linux/Mac
./start-services.sh
```

## Manual Setup

### Backend (Node.js/Express)

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Or for production
npm start
```

### NLP Service (Python/Flask)

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

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Environment Configuration

### Backend (.env)

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/resume-screening
NLP_API_URL=http://localhost:5002/api
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NLP_API_URL=http://localhost:5002/api
```

### NLP Service (.env)

```
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Key Features

- Upload and parse resumes in PDF and DOCX formats
- Create and manage job descriptions by category
- Extract key information from resumes (skills, education, experience)
- Match resumes to job descriptions with ML-based scoring
- Visualize match results and candidate ranking

## Troubleshooting

### Connection Issues

If the frontend cannot connect to the backend:

1. Check that all services are running
2. Verify the API URLs in frontend/.env match the running services
3. Ensure MongoDB is running and accessible
4. Check for CORS issues in browser console

### Resume Processing Errors

If resume processing fails:

1. Check that the NLP service is running
2. Ensure Redis is running for Celery task queue
   - On Windows: `wsl redis-cli ping` to check Redis in WSL
   - On Linux: `redis-cli ping` should return PONG
3. Verify file format is supported (PDF or DOCX)
4. Check NLP service logs for Python errors

### Celery Worker Issues

If Celery worker fails to start or process tasks:

1. Ensure Redis is running and accessible
2. On Windows, use the `--pool=solo` option: `celery -A celery_config worker --loglevel=info --pool=solo`
3. Check that all Python dependencies are installed: `pip install -r requirements_fixed.txt`
4. Verify that the broker URL in `.env` or environment variables is correct

### Windows-Specific Issues

1. Use the provided batch scripts for starting services: `start-services.bat`
2. For Redis, consider using WSL or Docker
3. If Python processes hang, you can force stop them with: `taskkill /IM python.exe /F`

## Project Structure

```
/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── app.js        # Express app setup
│   └── server.js         # Entry point
│
├── frontend/             # React frontend
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── context/      # React context
│       ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Helper functions
│   │
│   └── src/
│       └── utils/        # Helper functions
│
├── nlp/                  # Python NLP service
│   ├── utils/            # NLP utility functions
│   ├── app.py            # Flask application
│   └── celery_config.py  # Celery configuration
│
└── docker-compose.yml    # Docker Compose configuration
```

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Your Name
- Other Contributors

## 📧 Contact

For any questions or suggestions, please contact:

- youremail@example.com

--> Start backend
cd backend
node scripts/seed-job-descriptions.js # Seed the database first
npm run dev

-->Install Redis if you haven't already
-->Start the redis server
sudo systemctl start redis-server
--> Verify that Redis is running:
redis-cli ping
-->Now, restart your NLP service:
cd nlp && source venv/bin/activate && python app.py
--> Start the Celery worker for your NLP service (in a new terminal window):
cd nlp && source venv/bin/activate && celery -A celery_config worker --loglevel=info
-->You need to install Celery in your Python virtual environment:
cd nlp && source venv/bin/activate && pip install celery
--> Start NLP
cd
python -m venv venv # Create virtual environment
source venv/bin/activate
pip install -r requirements.txt
pip install scikit-learn sentence-transformers spacy
python -m spacy download en_core_web_lg
python app.py
--> start script for nlp server
./start_services.sh

--> Start frontend
cd frontend
npm start

---

taskkill /IM python.exe /F
wsl redis-cli ping
cd nlp && export FLASK_ENV=development && python app.py
cd nlp && celery -A celery_config worker --loglevel=DEBUG -P solo
cd d:/Work-Space/My-uni-fyp/fyp-ai-resume-screening-tool && ./start-services.sh
