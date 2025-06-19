#!/usr/bin/env python3
"""
Test script for resume processing
This script tests the resume processing functionality directly
"""

import os
import sys
import logging
import requests
import json
from utils.extract_text import extract_text, test_extraction
from utils.extract_skills import extract_skills
from utils.extract_education import extract_education
from utils.extract_experience import extract_experience
from utils.calculate_score import calculate_match_score

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_docx_extraction(file_path):
    """Test extraction for DOCX files"""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return False
    
    logger.info(f"Testing DOCX extraction on: {file_path}")
    
    # Test extraction
    extracted_text = extract_text(file_path)
    if not extracted_text:
        logger.error("DOCX extraction failed!")
        return False
    
    logger.info(f"Successfully extracted {len(extracted_text)} characters from DOCX")
    logger.info(f"Text preview: {extracted_text[:200]}...")
    
    # Test skills extraction
    skills = extract_skills(extracted_text)
    logger.info(f"Extracted skills: {skills}")
    
    # Test education extraction
    education = extract_education(extracted_text)
    logger.info(f"Extracted education: {education}")
    
    # Test experience extraction
    experience = extract_experience(extracted_text)
    logger.info(f"Extracted experience: {experience}")
    
    return True

def test_resume_api_endpoint(file_path, api_url="http://localhost:5002/api/process"):
    """Test the resume processing API endpoint"""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return False
    
    logger.info(f"Testing resume processing API endpoint with file: {file_path}")
    
    # Create form data for the request
    files = {
        'resume': (os.path.basename(file_path), open(file_path, 'rb'), 'application/octet-stream')
    }
    
    data = {
        'jobDescription': 'Test job description for a software engineer position',
        'jobCategory': 'Software Engineer',
        'requiredSkills': 'python,javascript,html,css'
    }
    
    try:
        # Send request to API
        logger.info(f"Sending request to {api_url}")
        response = requests.post(api_url, files=files, data=data)
        
        # Log response details
        logger.info(f"Response status code: {response.status_code}")
        logger.info(f"Response headers: {response.headers}")
        
        try:
            response_data = response.json()
            logger.info(f"Response JSON: {json.dumps(response_data, indent=2)}")
            
            if response.status_code == 202 and response_data.get('success', False):
                task_id = response_data.get('taskId')
                logger.info(f"Task ID: {task_id}")
                return True
            else:
                logger.error(f"API error: {response_data.get('message', 'Unknown error')}")
                return False
        except ValueError:
            logger.error(f"Invalid JSON response: {response.text[:500]}")
            return False
        
    except Exception as e:
        logger.error(f"Error testing API endpoint: {str(e)}")
        return False
    finally:
        # Close the file
        files['resume'][1].close()

def test_celery_task(task_id, api_url="http://localhost:5002/api/task"):
    """Test checking the status of a Celery task"""
    if not task_id:
        logger.error("No task ID provided")
        return False
    
    url = f"{api_url}/{task_id}"
    logger.info(f"Checking task status at: {url}")
    
    try:
        response = requests.get(url)
        logger.info(f"Task status response code: {response.status_code}")
        
        try:
            response_data = response.json()
            logger.info(f"Task status: {json.dumps(response_data, indent=2)}")
            
            if response_data.get('status') == 'completed':
                logger.info("Task completed successfully!")
                return True
            elif response_data.get('status') == 'failed':
                logger.error(f"Task failed: {response_data.get('error', 'Unknown error')}")
                return False
            else:
                logger.info(f"Task still processing: {response_data.get('status')}")
                return None
        except ValueError:
            logger.error(f"Invalid JSON response: {response.text[:500]}")
            return False
            
    except Exception as e:
        logger.error(f"Error checking task status: {str(e)}")
        return False

def main():
    """Main function"""
    if len(sys.argv) < 2:
        logger.error("Usage: python test_resume_processing.py <file_path> [--api-test] [--task-id TASK_ID]")
        return 1
    
    file_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return 1
    
    # Determine test type
    if '--api-test' in sys.argv:
        success = test_resume_api_endpoint(file_path)
    elif '--task-id' in sys.argv:
        try:
            task_index = sys.argv.index('--task-id')
            task_id = sys.argv[task_index + 1]
            success = test_celery_task(task_id)
        except (ValueError, IndexError):
            logger.error("Invalid task ID argument")
            return 1
    else:
        # Default: test file extraction
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext == '.docx':
            success = test_docx_extraction(file_path)
        else:
            success = test_extraction(file_path)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 