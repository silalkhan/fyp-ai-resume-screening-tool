#!/usr/bin/env python3
"""
Test script for Celery task processing
"""

import os
import sys
import time
import logging
import uuid
import json
from celery import Celery
import redis

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_redis_connection():
    """Check if Redis is running and accessible"""
    try:
        r = redis.Redis(host='localhost', port=6379, db=0)
        response = r.ping()
        logger.info(f"Redis connection: {'OK' if response else 'FAILED'}")
        return response
    except Exception as e:
        logger.error(f"Redis connection error: {str(e)}")
        return False

def check_celery_config():
    """Check if Celery is configured correctly"""
    try:
        # Import locally to avoid initialization issues
        from celery_config import app as celery_app
        
        broker = celery_app.conf.broker_url
        backend = celery_app.conf.result_backend
        
        logger.info(f"Celery broker: {broker}")
        logger.info(f"Celery backend: {backend}")
        
        if not broker or not backend:
            logger.error("Celery broker or backend is not configured")
            return False
            
        # Check if broker and backend are accessible
        try:
            connection = celery_app.connection()
            connection.ensure_connection(timeout=3)
            logger.info("Celery broker connection: OK")
            connection.close()
        except Exception as e:
            logger.error(f"Celery broker connection error: {str(e)}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Error checking Celery configuration: {str(e)}")
        return False

def create_test_task():
    """Create and run a simple test task"""
    try:
        # Import locally to avoid initialization issues
        from celery_config import app as celery_app
        
        @celery_app.task(name='test_task')
        def test_task(value):
            logger.info(f"Test task running with value: {value}")
            return {'success': True, 'message': f'Processed value: {value}'}
        
        test_value = f"test_{uuid.uuid4()}"
        logger.info(f"Submitting test task with value: {test_value}")
        
        result = test_task.delay(test_value)
        task_id = result.id
        
        logger.info(f"Test task submitted with ID: {task_id}")
        return task_id
    except Exception as e:
        logger.error(f"Error creating test task: {str(e)}")
        return None

def check_task_status(task_id, max_attempts=10, delay=1):
    """Check the status of a task"""
    if not task_id:
        logger.error("No task ID provided")
        return False
        
    try:
        # Import locally to avoid initialization issues
        from celery_config import app as celery_app
        
        attempts = 0
        while attempts < max_attempts:
            attempts += 1
            
            try:
                result = celery_app.AsyncResult(task_id)
                logger.info(f"Task status: {result.state}")
                
                if result.state == 'SUCCESS':
                    logger.info(f"Task result: {result.get()}")
                    return True
                elif result.state == 'FAILURE':
                    logger.error(f"Task failed: {result.traceback}")
                    return False
                    
                time.sleep(delay)
            except Exception as e:
                logger.error(f"Error checking task status: {str(e)}")
                time.sleep(delay)
        
        logger.warning(f"Task status check timed out after {max_attempts} attempts")
        return False
    except Exception as e:
        logger.error(f"Error in task status check: {str(e)}")
        return False

def check_resume_processing():
    """Test the resume processing flow end-to-end"""
    try:
        # Import locally to avoid initialization issues
        from utils.tasks import process_resume
        from utils.extract_text import extract_text
        
        # Find a sample resume
        sample_resumes = []
        for root, _, files in os.walk("../backend/uploads"):
            for file in files:
                if file.lower().endswith(('.pdf', '.docx')):
                    sample_resumes.append(os.path.join(root, file))
                    
        if not sample_resumes:
            logger.error("No sample resumes found")
            return False
            
        sample_resume = sample_resumes[0]
        logger.info(f"Testing with sample resume: {sample_resume}")
        
        # Test extraction directly
        text = extract_text(sample_resume)
        if not text:
            logger.error("Text extraction failed")
            return False
        logger.info(f"Text extraction: OK ({len(text)} characters)")
        
        # Test task submission
        logger.info("Submitting resume processing task")
        job_description = "Sample job description for testing"
        job_skills = ["python", "flask", "celery"]
        job_category = "Software Engineer"
        
        task = process_resume.delay(sample_resume, job_description, job_skills, job_category)
        task_id = task.id
        logger.info(f"Resume processing task submitted with ID: {task_id}")
        
        # Check task status
        logger.info("Checking task status")
        max_attempts = 30
        delay = 2
        
        attempts = 0
        while attempts < max_attempts:
            attempts += 1
            
            try:
                result = process_resume.AsyncResult(task_id)
                logger.info(f"Task status: {result.state}")
                
                if result.state == 'SUCCESS':
                    task_result = result.get()
                    logger.info(f"Task successful: {json.dumps(task_result, indent=2)}")
                    return True
                elif result.state == 'FAILURE':
                    logger.error(f"Task failed: {result.traceback}")
                    return False
                    
                time.sleep(delay)
            except Exception as e:
                logger.error(f"Error checking task status: {str(e)}")
                time.sleep(delay)
        
        logger.warning(f"Resume processing task timed out after {max_attempts*delay} seconds")
        return False
    except Exception as e:
        logger.error(f"Error in resume processing test: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Main function"""
    print("=" * 80)
    print(" CELERY TASK PROCESSING DIAGNOSTIC ")
    print("=" * 80)
    
    # Check Redis
    print("\n[1] Checking Redis connection...")
    redis_ok = check_redis_connection()
    if not redis_ok:
        print("❌ Redis is not running or not accessible")
        print("   Please make sure Redis is running with: redis-server")
        return 1
    print("✅ Redis connection: OK")
    
    # Check Celery configuration
    print("\n[2] Checking Celery configuration...")
    celery_ok = check_celery_config()
    if not celery_ok:
        print("❌ Celery configuration issue detected")
        return 1
    print("✅ Celery configuration: OK")
    
    # Run a test task
    print("\n[3] Running a simple test task...")
    task_id = create_test_task()
    if not task_id:
        print("❌ Failed to create test task")
        return 1
        
    task_ok = check_task_status(task_id)
    if not task_ok:
        print("❌ Test task failed or timed out")
        print("   This indicates an issue with Celery task processing")
        return 1
    print("✅ Test task completed successfully")
    
    # Test resume processing
    print("\n[4] Testing resume processing flow...")
    resume_ok = check_resume_processing()
    if not resume_ok:
        print("❌ Resume processing test failed")
        return 1
    print("✅ Resume processing test: OK")
    
    # Success
    print("\n" + "=" * 80)
    print(" ALL TESTS PASSED - SYSTEM IS WORKING CORRECTLY ")
    print("=" * 80)
    return 0

if __name__ == "__main__":
    sys.exit(main()) 