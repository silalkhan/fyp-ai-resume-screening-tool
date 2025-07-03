import os
import sys
import platform
import socket
import time
import importlib
import logging
from logging.handlers import RotatingFileHandler

# Configure simple logging for diagnostics
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("diagnose")

# Add success/failure indicators
SUCCESS = "✓"
FAILURE = "✗"
WARNING = "!"

def test_imports():
    """Test importing critical modules"""
    print("--- Testing Module Imports ---")
    
    modules = {
        "Celery": "celery",
        "Flask": "flask",
        "spaCy": "spacy",
        "Sentence Transformers": "sentence_transformers",
        "MongoDB Client": "pymongo",
        "PyPDF2": "PyPDF2",
        "python-docx": "docx",
        "textract": "textract",
        "docx2txt": "docx2txt",
        "zipfile": "zipfile",
    }
    
    for name, module in modules.items():
        try:
            importlib.import_module(module)
            print(f"{SUCCESS} {name} imported successfully")
        except ImportError as e:
            print(f"{FAILURE} {name} import failed: {str(e)}")

def test_celery():
    """Test Celery configuration"""
    try:
        from celery_config import app
        print(f"{SUCCESS} Celery imported successfully")
        
        broker = app.conf.broker_url
        backend = app.conf.result_backend
        
        print(f"Celery configured with broker: {broker}")
        print(f"Celery result backend: {backend}")
        
        # Test broker connection
        if broker and broker.startswith('redis://'):
            test_redis_connection(broker)
    except ImportError:
        print(f"{FAILURE} Failed to import Celery configuration")
    except Exception as e:
        print(f"{FAILURE} Error testing Celery: {str(e)}")

def test_redis_connection(redis_url="redis://localhost:6379/0"):
    """Test connection to Redis"""
    print(f"Testing Redis connection to: {redis_url}")
    try:
        import redis
        
        # Parse Redis URL
        if '://' in redis_url:
            redis_url = redis_url.split('://', 1)[1]
        
        host = redis_url.split(':')[0] or 'localhost'
        
        if ':' in redis_url:
            port_db = redis_url.split(':', 1)[1]
            if '/' in port_db:
                port = int(port_db.split('/', 1)[0]) 
                db = int(port_db.split('/', 1)[1])
            else:
                port = int(port_db)
                db = 0
        else:
            port = 6379
            db = 0
        
        r = redis.Redis(host=host, port=port, db=db, socket_connect_timeout=5)
        r.ping()  # Will raise exception if connection fails
        print(f"{SUCCESS} Successfully connected to Redis at {host}")
    except ImportError:
        print(f"{FAILURE} Redis Python client not installed")
    except Exception as e:
        print(f"{FAILURE} Failed to connect to Redis: {str(e)}")

def check_wsl_redis():
    """Check Redis in WSL on Windows"""
    print("\n--- Checking WSL Redis ---")
    
    if platform.system() != "Windows":
        print("Not running on Windows, skipping WSL Redis check")
        return
        
    wsl_hosts = ['172.17.0.1', '172.18.0.1', '192.168.1.1']
    for host in wsl_hosts:
        print(f"Testing WSL Redis at {host}...")
        test_redis_connection(f"redis://{host}:6379/0")

def check_celery_workers():
    """Check if Celery workers are running"""
    print("\n--- Celery Status ---")
    
    try:
        from celery_config import app
        
        # Get list of active workers
        i = app.control.inspect()
        stats = i.stats()
        
        if stats:
            print(f"✅ Celery workers are running")
            print(f"Active workers: {list(stats.keys())}")
        else:
            print(f"{FAILURE} No Celery workers found")
            
        # Check registered tasks
        try:
            registered = i.registered()
            if registered:
                print("\nRegistered tasks:")
                for worker, tasks in registered.items():
                    print(f"  {worker}: {len(tasks)} tasks")
                    # Print the first 5 tasks
                    for task in tasks[:5]:
                        print(f"    - {task}")
                    if len(tasks) > 5:
                        print(f"    - ... and {len(tasks) - 5} more")
        except:
            print(f"{WARNING} Could not retrieve registered tasks")
            
    except Exception as e:
        print(f"{FAILURE} Error checking Celery workers: {str(e)}")

def check_env_vars():
    """Check environment variables"""
    print("\n--- Environment Variables ---")
    
    env_vars = [
        'CELERY_BROKER_URL',
        'CELERY_RESULT_BACKEND',
        'WSL_HOST_IP',
    ]
    
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            print(f"{var}: {value}")
        else:
            print(f"{var}: Not set")

def check_network():
    """Check network information"""
    print("\n--- Network Info ---")
    
    hostname = socket.gethostname()
    print(f"Hostname: {hostname}")
    
    try:
        # Get local IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Doesn't need to be reachable
        s.connect(('10.255.255.255', 1))
        local_ip = s.getsockname()[0]
        s.close()
        print(f"Local IP: {local_ip}")
    except Exception as e:
        print(f"Could not determine local IP: {str(e)}")

def test_pdf_extraction(sample_file=None):
    """Test PDF extraction functionality"""
    print("\n--- PDF Extraction Test ---")
    
    # Try to find a PDF file if not provided
    if not sample_file:
        # Look in typical locations
        potential_paths = [
            './temp_uploads',
            '../backend/uploads',
            './',
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                pdf_files = [f for f in os.listdir(path) if f.lower().endswith('.pdf')]
                if pdf_files:
                    sample_file = os.path.join(path, pdf_files[0])
                    break
    
    if not sample_file or not os.path.exists(sample_file):
        print(f"{WARNING} No PDF file found for testing")
        return
    
    try:
        print(f"Testing PDF extraction with: {sample_file}")
        from utils.extract_text import extract_text_from_pdf
        
        text = extract_text_from_pdf(sample_file)
        if text and len(text) > 100:
            print(f"{SUCCESS} PDF extraction successful, extracted {len(text)} chars")
            print(f"Preview: {text[:100]}...")
        else:
            print(f"{FAILURE} PDF extraction failed or returned insufficient text")
    except Exception as e:
        print(f"{FAILURE} PDF extraction error: {str(e)}")
        import traceback
        print(traceback.format_exc())

def test_docx_extraction(sample_file=None):
    """Test DOCX extraction functionality"""
    print("\n--- DOCX Extraction Test ---")
    
    # Try to find a DOCX file if not provided
    if not sample_file:
        # Look in typical locations
        potential_paths = [
            './temp_uploads',
            '../backend/uploads',
            './',
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                docx_files = [f for f in os.listdir(path) if f.lower().endswith('.docx')]
                if docx_files:
                    sample_file = os.path.join(path, docx_files[0])
                    break
    
    if not sample_file or not os.path.exists(sample_file):
        print(f"{WARNING} No DOCX file found for testing")
        return
    
    try:
        print(f"Testing DOCX extraction with: {sample_file}")
        from utils.extract_text import extract_text_from_docx, extract_text_from_docx_alternative
        
        # Try primary method
        text = extract_text_from_docx(sample_file)
        if text and len(text) > 100:
            print(f"{SUCCESS} Primary DOCX extraction successful, extracted {len(text)} chars")
            print(f"Preview: {text[:100]}...")
        else:
            print(f"{FAILURE} Primary DOCX extraction failed or returned insufficient text")
        
        # Try alternative method
        try:
            alt_text = extract_text_from_docx_alternative(sample_file)
            if alt_text and len(alt_text) > 100:
                print(f"{SUCCESS} Alternative DOCX extraction successful, extracted {len(alt_text)} chars")
                print(f"Preview: {alt_text[:100]}...")
            else:
                print(f"{WARNING} Alternative DOCX extraction failed or returned insufficient text")
        except Exception as alt_e:
            print(f"{FAILURE} Alternative DOCX extraction error: {str(alt_e)}")
    except Exception as e:
        print(f"{FAILURE} DOCX extraction error: {str(e)}")
        import traceback
        print(traceback.format_exc())

def test_full_processing_pipeline(sample_file=None):
    """Test the full processing pipeline"""
    print("\n--- Full Processing Pipeline Test ---")
    
    # Try to find a resume file if not provided
    if not sample_file:
        # Look in typical locations
        potential_paths = [
            './temp_uploads',
            '../backend/uploads',
            './',
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                resume_files = [f for f in os.listdir(path) 
                               if f.lower().endswith(('.pdf', '.docx'))]
                if resume_files:
                    sample_file = os.path.join(path, resume_files[0])
                    break
    
    if not sample_file or not os.path.exists(sample_file):
        print(f"{WARNING} No resume file found for testing")
        return
    
    try:
        print(f"Testing full processing with: {sample_file}")
        
        # Step 1: Text Extraction
        from utils.extract_text import extract_text
        text = extract_text(sample_file)
        if not text or len(text) < 100:
            print(f"{FAILURE} Text extraction failed or returned insufficient text")
            return
        
        print(f"{SUCCESS} Text extraction successful, extracted {len(text)} chars")
        
        # Step 2: Skills Extraction
        from utils.extract_skills import extract_skills
        skills = extract_skills(text, ["python", "javascript", "react"])
        print(f"{SUCCESS} Skills extraction found {len(skills)} skills: {skills}")
        
        # Step 3: Education Extraction
        from utils.extract_education import extract_education
        education = extract_education(text)
        print(f"{SUCCESS} Education extraction found {len(education)} entries")
        
        # Step 4: Experience Extraction
        from utils.extract_experience import extract_experience
        experience = extract_experience(text)
        print(f"{SUCCESS} Experience extraction found {len(experience)} entries")
        
        # Step 5: Match Score Calculation
        from utils.calculate_score import calculate_match_score
        job_description = "We are looking for a skilled software developer with Python experience."
        job_skills = ["python", "javascript", "django"]
        
        score = calculate_match_score(text, job_description, skills, job_skills)
        print(f"{SUCCESS} Match score calculation successful: {score}")
        
    except Exception as e:
        print(f"{FAILURE} Full pipeline test error: {str(e)}")
        import traceback
        print(traceback.format_exc())

def main():
    """Main diagnostic function"""
    print("=== Resume Screening Diagnostics ===")
    print(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python: {sys.version}")
    print(f"Platform: {platform.system()} {platform.release()}")
    print()
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Run diagnostics on the resume screening system')
    parser.add_argument('--pdf', help='Path to a PDF file for testing extraction')
    parser.add_argument('--docx', help='Path to a DOCX file for testing extraction')
    parser.add_argument('--resume', help='Path to a resume file for testing the full pipeline')
    args = parser.parse_args()
    
    # Run all tests
    test_imports()
    test_celery()
    check_wsl_redis()
    check_celery_workers()
    check_env_vars()
    check_network()
    test_pdf_extraction(args.pdf)
    test_docx_extraction(args.docx)
    test_full_processing_pipeline(args.resume)
    
    print("\n===== End of Diagnostic =====")

if __name__ == "__main__":
    main() 