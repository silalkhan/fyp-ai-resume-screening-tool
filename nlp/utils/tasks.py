from celery_config import app
from .extract_text import extract_text
from .extract_skills import extract_skills
from .extract_education import extract_education
from .extract_experience import extract_experience
from .extract_projects import extract_projects
from .calculate_score import calculate_match_score, detect_job_category, normalize_job_category
import os
import re
import spacy
import logging
import time
import traceback
from celery.signals import worker_ready

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_sm')
    logger.info("Loaded spaCy model for tasks")
except Exception as e:
    logger.error(f"Error loading spaCy model in tasks: {str(e)}")
    nlp = None

def extract_contact_info(text):
    """Extract contact information from resume text"""
    if not text:
        return {}
        
    contact = {}
    # Email pattern
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    # Phone pattern - handle various formats
    phone_pattern = r'(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    # LinkedIn pattern
    linkedin_pattern = r'(?:linkedin\.com/in/|linkedin:\s*)([a-zA-Z0-9_-]+)'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    linkedin = re.findall(linkedin_pattern, text.lower())
    
    if emails:
        contact['email'] = emails[0]
    if phones:
        contact['phone'] = phones[0]
    if linkedin:
        contact['linkedin'] = f"linkedin.com/in/{linkedin[0]}"
    
    # Extract address if NLP is available
    if nlp:
        try:
            doc = nlp(text[:5000])  # Process first 5000 chars to save time
            for ent in doc.ents:
                if ent.label_ in ['GPE', 'LOC']:
                    if 'address' not in contact:
                        contact['address'] = ent.text
                    else:
                        contact['address'] += f", {ent.text}"
        except Exception as e:
            logger.error(f"Error extracting address with spaCy: {str(e)}")
            
    return contact

def extract_candidate_name(text):
    """Extract candidate name from resume"""
    if not text or not nlp:
        return ''
        
    try:
        # Look for name at the beginning of the resume (first 1000 chars)
        doc = nlp(text[:1000])
        
        # First check for PERSON entities
        for ent in doc.ents:
            if ent.label_ == 'PERSON':
                # Validate this isn't a company name
                if not any(term in ent.text.lower() for term in ['inc', 'corp', 'llc', 'ltd', 'company']):
                    return ent.text
                    
        # If no clear PERSON entity, look for capitalized words at the start
        lines = text[:1000].split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if 2 <= len(line.split()) <= 5 and all(word[0].isupper() for word in line.split() if word):
                # Likely a name if 2-5 capitalized words
                return line
                
    except Exception as e:
        logger.error(f"Error extracting candidate name: {str(e)}")
    
    return ''

def retry_function(func, *args, max_attempts=3, delay=0.5, backoff_factor=1):
    """Retry a function multiple times with delay between attempts
    
    Args:
        func: Function to retry
        *args: Arguments to pass to the function
        max_attempts: Maximum number of attempts
        delay: Initial delay between attempts
        backoff_factor: Factor to multiply delay by after each attempt
    """
    last_error = None
    current_delay = delay
    
    for attempt in range(max_attempts):
        try:
            return func(*args)
        except Exception as e:
            last_error = e
            if attempt < max_attempts - 1:  # Don't sleep on the last attempt
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {current_delay} seconds.")
                time.sleep(current_delay)
                current_delay *= backoff_factor  # Apply backoff factor
            else:
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
    
    if last_error:
        logger.error(f"All {max_attempts} attempts failed. Last error: {str(last_error)}")
        raise last_error

@app.task(name='process_resume', bind=True, max_retries=3, retry_backoff=True)
def process_resume(self, file_path, job_description, job_skills, job_category=None):
    """
    Process resume and calculate match score
    
    Args:
        file_path: Path to the resume file
        job_description: Job description text
        job_skills: List of required skills
        job_category: Job category (optional, will be detected from description if not provided)
    """
    try:
        logger.info(f"Starting to process resume: {file_path}")
        
        # Input validation
        if not os.path.exists(file_path):
            error_msg = f"Resume file not found: {file_path}"
            logger.error(error_msg)
            return {
                'success': False, 
                'message': error_msg
            }
        
        # Log file details
        try:
            file_size = os.path.getsize(file_path)
            file_ext = os.path.splitext(file_path)[1].lower()
            logger.info(f"File details: path={file_path}, size={file_size} bytes, type={file_ext}")
            
            if file_size == 0:
                raise ValueError("File is empty")
            
            if file_ext not in ['.pdf', '.docx']:
                raise ValueError(f"Unsupported file type: {file_ext}")
                
        except Exception as e:
            logger.error(f"File validation error: {str(e)}")
            return {
                'success': False,
                'message': f"File validation failed: {str(e)}"
            }
        
        # Validate other inputs
        if not job_description:
            logger.warning("Empty job description provided")
        
        if isinstance(job_skills, str):
            job_skills = [s.strip() for s in job_skills.split(',') if s.strip()]
            logger.info(f"Converted job_skills string to list: {job_skills}")
        
        if not job_skills:
            logger.warning("No job skills provided")
            job_skills = []
            
        # Log the job category from input
        logger.info(f"Received job category: '{job_category}'")
        
        # Normalize category if provided
        normalized_category = None
        if job_category:
            try:
                normalized_category = normalize_job_category(job_category)
                logger.info(f"Normalized job category: '{normalized_category}'")
            except Exception as e:
                logger.error(f"Category normalization failed: {str(e)}")
                # Continue with original category
                normalized_category = job_category
        
        # Extract text from resume with retries
        try:
            logger.info(f"Extracting text from resume (with retries): {file_path}")
            resume_text = retry_function(
                extract_text,
                file_path,
                max_attempts=3,
                delay=1,
                backoff_factor=2
            )
            
            if not resume_text or not resume_text.strip():
                raise ValueError("Empty text extracted from resume")
                
        except Exception as e:
            logger.error(f"Failed to extract text from resume: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Retry the task if we haven't exceeded max retries
            if self.request.retries < self.max_retries:
                logger.info(f"Retrying task, attempt {self.request.retries + 1}")
                raise self.retry(exc=e)
                
            return {
                'success': False, 
                'message': f'Text extraction failed: {str(e)}'
            }
            
        logger.info(f"Successfully extracted {len(resume_text)} characters from resume")
        logger.info(f"Text sample: {resume_text[:200]}...")

        # If job category not provided or normalization failed, detect it
        if not normalized_category:
            detected_category = detect_job_category(job_description)
            logger.info(f"Detected job category: {detected_category}")
            normalized_category = detected_category

        # Extract information from resume with error handling
        try:
            # Extract skills
            logger.info("Extracting skills from resume")
            skills = retry_function(extract_skills, resume_text, job_skills, max_attempts=2)
            logger.info(f"Extracted {len(skills)} skills: {skills[:10]}")
            
            # Extract education
            logger.info("Extracting education from resume")
            education = retry_function(extract_education, resume_text, max_attempts=2)
            logger.info(f"Extracted {len(education)} education entries")
            
            # Extract experience
            logger.info("Extracting experience from resume")
            experience = retry_function(extract_experience, resume_text, max_attempts=2)
            logger.info(f"Extracted {len(experience)} experience entries")
            
            # Extract projects
            logger.info("Extracting projects from resume")
            projects = retry_function(extract_projects, resume_text, max_attempts=2)
            logger.info(f"Extracted {len(projects)} projects")
            
            # Extract contact info
            logger.info("Extracting contact info from resume")
            contact_info = retry_function(extract_contact_info, resume_text, max_attempts=2)
            logger.info(f"Contact info extracted: {contact_info.keys()}")
            
            # Extract candidate name
            logger.info("Extracting candidate name from resume")
            candidate_name = retry_function(extract_candidate_name, resume_text, max_attempts=2)
            logger.info(f"Candidate name: {candidate_name}")
        except Exception as e:
            logger.error(f"Error extracting information from resume: {str(e)}")
            logger.error(traceback.format_exc())
            # Set default values to continue processing
            skills = []
            education = []
            experience = []
            projects = []
            contact_info = {}
            candidate_name = ""
        
        # Calculate match score
        try:
            logger.info(f"Calculating match score using category: {normalized_category}")
            match_score = calculate_match_score(resume_text, job_description, skills, job_skills, normalized_category)
            logger.info(f"Match score calculated: {match_score}")
        except Exception as e:
            logger.error(f"Error calculating match score: {str(e)}")
            logger.error(traceback.format_exc())
            # Use default score
            match_score = 45.0
            logger.info(f"Using default match score due to error: {match_score}")

        # Cleanup
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to delete temporary file: {str(e)}")

        # Map back to frontend category format for response
        frontend_category = job_category or normalized_category
        
        # Prepare response
        return {
            'success': True,
            'message': 'Resume processed successfully',
            'data': {
                'candidateName': candidate_name or '',
                'contactInfo': contact_info or {},
                'skills': skills or [],
                'education': education or [],
                'experience': experience or [],
                'projects': projects or [],
                'matchScore': match_score,
                'jobCategory': frontend_category, 
                'isShortlisted': match_score >= 75
            }
        }
    except Exception as e:
        logger.error(f"Unexpected error processing resume: {str(e)}")
        logger.error(traceback.format_exc())
        # Cleanup on error
        try:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except Exception as cleanup_error:
            logger.warning(f"Error during cleanup: {str(cleanup_error)}")
            
        return {
            'success': False, 
            'message': f'Error processing resume: {str(e)}'
        }