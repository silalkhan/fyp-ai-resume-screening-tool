from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from werkzeug.utils import secure_filename
import os
import sys
import traceback
import logging
import logging.handlers
from flask_cors import CORS

# Celery imports
from celery.result import AsyncResult
from utils.tasks import app as celery_app
from utils.extract_text import extract_text
from utils.calculate_score import normalize_job_category

# Create logs directory if it doesn't exist
logs_dir = 'logs'
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

# Set up rotating file handler for detailed logs
file_handler = logging.handlers.RotatingFileHandler(
    os.path.join(logs_dir, 'nlp_service.log'),
    maxBytes=10485760,  # 10MB
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)

# Set up console handler for immediate feedback
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

# Configure application logger
logger = logging.getLogger('nlp_service')
logger.setLevel(logging.DEBUG)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
api = Api(app, 
    title='Resume Processing API',
    description='NLP-based resume processing',
    version='1.0',
    doc='/docs'
)

# Now import the modules after logging is set up
try:
    from utils.tasks import process_resume
    from utils.extract_text import extract_text
    from utils.calculate_score import CATEGORY_MAPPING, JOB_CATEGORIES, detect_duplicate, normalize_job_category
    from celery_config import app as celery_app
    logger.info("Successfully imported all required modules")
except Exception as import_error:
    logger.error(f"Error importing modules: {str(import_error)}")
    logger.error(traceback.format_exc())
    # Continue without failing - we'll handle missing imports in each endpoint

# Define namespaces
ns = api.namespace('api', description='Resume processing operations')

# Define models for request/response
job_category_model = api.model('JobCategory', {
    'id': fields.String(description='Job category ID'),
    'name': fields.String(description='Job category name'),
    'description': fields.String(description='Job category description')
})

resume_response = api.model('ResumeResponse', {
    'success': fields.Boolean(description='Operation success status'),
    'message': fields.String(description='Response message'),
    'taskId': fields.String(description='Celery task ID for async processing')
})

result_response = api.model('ResultResponse', {
    'success': fields.Boolean(description='Operation success status'),
    'status': fields.String(description='Task status'),
    'result': fields.Raw(description='Processing results'),
    'category': fields.String(description='Detected job category')
})

app.config['UPLOAD_FOLDER'] = 'temp_uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

@api.route('/')
class Home(Resource):
    def get(self):
        if 'application/json' in request.accept_mimetypes:
            return jsonify({'message': 'AI-Driven Resume Processing API', 'status': 'running'})
        return api

@api.route('/api/health')
class Health(Resource):
    def get(self):
        """Health check endpoint"""
        return jsonify({
            'status': 'ok',
            'service': 'nlp',
            'version': '1.0'
        })

@api.route('/api/categories')
class JobCategories(Resource):
    @api.marshal_list_with(job_category_model)
    def get(self):
        """Get available job categories"""
        try:
            categories = [
                {
                    'id': 'UET Peshawar',
                    'name': 'Lecturer at UET Peshawar',
                    'description': 'Academic positions at University of Engineering and Technology, Peshawar'
                },
                {
                    'id': 'Cybersecurity',
                    'name': 'Cybersecurity Specialist',
                    'description': 'Information security and cybersecurity positions'
                },
                {
                    'id': 'Web Developer',
                    'name': 'Web Developer',
                    'description': 'Frontend, Backend, and Full Stack Development positions'
                },
                {
                    'id': 'Python Developer',
                    'name': 'Python Developer',
                    'description': 'Python development and related technologies'
                },
                {
                    'id': 'Software Engineer',
                    'name': 'Software Engineer',
                    'description': 'General software engineering positions'
                }
            ]
            return categories
        except Exception as e:
            logger.error(f"Error getting job categories: {str(e)}")
            return [], 500

@api.route('/api/process')
class ProcessResume(Resource):
    @api.expect(resume_response)
    def post(self):
        try:
            logger.info("Resume processing request received")
            
            # Input validation
            if 'resume' not in request.files:
                logger.error('No file uploaded')
                return jsonify({
                    'success': False,
                    'message': 'No file was uploaded'
                }), 400

            file = request.files['resume']
            if file.filename == '':
                logger.error('No file selected')
                return jsonify({
                    'success': False,
                    'message': 'No file was selected'
                }), 400

            # Log file details
            filename = secure_filename(file.filename)
            file_extension = os.path.splitext(filename)[1].lower()
            logger.info(f"Processing file: {filename} ({file_extension})")

            if not ('.' in file.filename and file_extension in {'.pdf', '.docx'}):
                logger.error(f'Invalid file type: {file_extension}')
                return jsonify({
                    'success': False,
                    'message': 'Only PDF and DOCX files are allowed'
                }), 400

            job_description = request.form.get('jobDescription', '')
            if job_description and len(job_description) > 10000:
                logger.error('Job description too long')
                return jsonify({'success': False, 'message': 'Job description is too long'}), 400

            # Handle different formats of job category from frontend/backend
            job_category = request.form.get('jobCategory', '')
            logger.info(f"Received job category: {job_category}")
            
            # Normalize the category
            internal_category = normalize_job_category(job_category)
            logger.info(f"Normalized to internal category: {internal_category}")
            
            if not internal_category:
                logger.error('Invalid job category after normalization')
                return jsonify({'success': False, 'message': 'Invalid job category'}), 400

            job_skills = []
            if request.form.get('requiredSkills'):
                job_skills = [skill.strip() for skill in request.form.get('requiredSkills').split(',') if skill.strip()]
                logger.info(f"Required skills: {job_skills}")

            # Save the file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            logger.info(f"Saved resume: {file_path}")
            
            # Verify the file exists
            if not os.path.exists(file_path):
                logger.error(f"File was not saved properly: {file_path}")
                return jsonify({'success': False, 'message': 'Error saving file'}), 500
                
            # Test text extraction directly
            try:
                text_sample = extract_text(file_path)
                if text_sample:
                    text_preview = text_sample[:100] + "..." if len(text_sample) > 100 else text_sample
                    logger.info(f"Text extraction successful. Preview: {text_preview}")
                else:
                    logger.warning(f"Text extraction returned empty result for {file_path}")
            except Exception as extract_error:
                logger.error(f"Text extraction test failed: {str(extract_error)}")
                logger.error(traceback.format_exc())

            # Process the resume asynchronously
            try:
                task = process_resume.delay(file_path, job_description, job_skills, job_category)
                task_id = task.id
                logger.info(f'Resume processing queued: {filename}, Task ID: {task_id}, Category: {job_category}')
            except Exception as task_error:
                logger.error(f"Error creating Celery task: {str(task_error)}")
                logger.error(traceback.format_exc())
                return jsonify({'success': False, 'message': f'Error queueing task: {str(task_error)}'}), 500

            response_data = {
                'success': True,
                'message': 'Resume processing queued',
                'taskId': task_id,
                'category': job_category
            }
            return response_data, 202

        except Exception as e:
            logger.error(f'Unhandled error in process endpoint: {str(e)}')
            logger.error(traceback.format_exc())
            if 'file_path' in locals() and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Cleaned up file after error: {file_path}")
                except Exception as cleanup_error:
                    logger.error(f"Error cleaning up file: {str(cleanup_error)}")
                    
            return jsonify({'success': False, 'message': f'Internal server error: {str(e)}'}), 500

@api.route('/api/task/<string:task_id>')
class TaskStatus(Resource):
    def get(self, task_id):
        try:
            if not task_id:
                logger.error("No task ID provided")
                return jsonify({
                    'success': False,
                    'status': 'failed',
                    'error': 'No task ID provided'
                }), 400

            task = AsyncResult(task_id, app=celery_app)
            logger.info(f"Checking status for task {task_id}: {task.state}")

            response = {
                'success': True,  # Default to True unless we hit an error case
                'status': task.state.lower()  # Convert Celery state to lowercase for consistency
            }

            if task.state == 'PENDING':
                response['message'] = 'Task is pending'
            elif task.state == 'STARTED':
                response['message'] = 'Task is in progress'
            elif task.state == 'SUCCESS':
                try:
                    # Log the raw result for debugging
                    logger.info(f"Task {task_id} result: {task.result}")
                    
                    if isinstance(task.result, dict):
                        # Check if the result has a success key
                        if 'success' in task.result:
                            response['success'] = task.result.get('success', False)
                            
                            # If the task result indicates failure, include the error
                            if not task.result.get('success', False):
                                response['error'] = task.result.get('message', 'Task completed but failed')
                        
                        # Always include the result regardless of success status
                        response['result'] = task.result
                    else:
                        # If result is not a dict, just include it as is
                        response['result'] = task.result
                        
                    # Set status to 'completed' for consistency with frontend expectations
                    response['status'] = 'completed'
                except Exception as e:
                    logger.error(f"Error processing task result: {str(e)}")
                    response['success'] = False
                    response['error'] = 'Error processing task result'
            elif task.state == 'FAILURE':
                error = str(task.result) if task.result else 'Unknown error occurred'
                logger.error(f"Task {task_id} failed with error: {error}")
                response['success'] = False
                response['error'] = error
            else:
                # Handle any other states
                response['message'] = f'Task is in state: {task.state}'

            # Log the final response for debugging
            logger.info(f"Returning response for task {task_id}: {response}")
            return jsonify(response)

        except Exception as e:
            logger.error(f"Error checking task status: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'status': 'error',
                'error': str(e)
            }), 500

@api.route('/api/detect-duplicates')
class DetectDuplicates(Resource):
    def post(self):
        try:
            if 'resume' not in request.files:
                logger.error('No file uploaded for duplicate detection')
                return jsonify({'success': False, 'message': 'No file was uploaded'}), 400

            file = request.files['resume']
            if file.filename == '':
                logger.error('No file selected for duplicate detection')
                return jsonify({'success': False, 'message': 'No file was selected'}), 400

            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            try:
                from utils.extract_text import extract_text
                from utils.calculate_score import detect_duplicate
            except ImportError as e:
                logger.error(f"Missing required module: {str(e)}")
                return jsonify({'success': False, 'message': f'Server configuration error: {str(e)}'}), 500

            resume_text = extract_text(file_path)
            if resume_text is None:
                os.remove(file_path)
                logger.error('Failed to extract text for duplicate detection')
                return jsonify({'success': False, 'message': 'Failed to extract text'}), 400

            existing_resume_files = [
                request.files[f'existingResume{i}']
                for i in range(len(request.files) - 1)
                if f'existingResume{i}' in request.files
            ]
            existing_resume_texts = []
            duplicates = []

            for i, existing_file in enumerate(existing_resume_files):
                existing_filename = secure_filename(existing_file.filename)
                existing_file_path = os.path.join(app.config['UPLOAD_FOLDER'], f'existing_{i}_{existing_filename}')
                existing_file.save(existing_file_path)
                existing_text = extract_text(existing_file_path)
                if existing_text:
                    existing_resume_texts.append(existing_text)
                if os.path.exists(existing_file_path):
                    os.remove(existing_file_path)

            is_duplicate, duplicate_indices = detect_duplicate(resume_text, existing_resume_texts)
            if is_duplicate:
                duplicates = [f'existingResume{i}' for i in duplicate_indices]

            if os.path.exists(file_path):
                os.remove(file_path)
            logger.info(f'Duplicate detection completed: {filename}')

            return jsonify({
                'success': True,
                'isDuplicate': is_duplicate,
                'duplicates': duplicates
            })
        except Exception as e:
            logger.error(f'Error detecting duplicates: {str(e)}')
            logger.error(traceback.format_exc())
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'success': False, 'message': f'Internal server error: {str(e)}'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    logger.error('File too large')
    return jsonify({'success': False, 'message': 'File is too large (max 5MB)'}), 413

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f'Unhandled error: {str(error)}')
    logger.error(traceback.format_exc())
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting NLP service...")
    app.run(debug=True, host='0.0.0.0', port=5002)