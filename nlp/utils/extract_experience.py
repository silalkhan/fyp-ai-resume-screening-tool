import re
import spacy
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

# Common job titles and roles to help with detection
JOB_TITLES = [
    'engineer', 'developer', 'analyst', 'scientist', 'manager', 'director', 'coordinator',
    'specialist', 'consultant', 'administrator', 'assistant', 'associate', 'lead',
    'architect', 'designer', 'technician', 'officer', 'head', 'chief', 'vp', 'president',
    'intern', 'trainee', 'supervisor', 'advisor', 'strategist', 'executive'
]

# Common experience section headers
EXPERIENCE_HEADERS = [
    'experience', 'work experience', 'employment history', 'work history', 
    'professional experience', 'career history', 'positions held'
]

def extract_experience(text):
    """
    Extract work experience information from resume text
    
    Args:
        text: The resume text
        
    Returns:
        List of dictionaries with experience information:
        - company: Company name
        - position: Job title/position
        - duration: Employment duration
        - description: Job description
    """
    try:
        logger.info("Starting experience extraction")
        experiences = []
        current_experience = None
        description_lines = []

        # Enhanced patterns for better detection
        job_title_pattern = r'(?i)(senior|junior|lead|principal|staff|chief|head|associate)?\s*(software|data|machine learning|full stack|frontend|backend|web|mobile|cloud|devops|qa|test|security|network|systems|project|product|program|business|marketing|sales|hr|financial|operations)?\s*(engineer|developer|analyst|scientist|manager|director|architect|designer|administrator|specialist|consultant|coordinator)'
        
        # Improved company pattern to catch more company names
        company_pattern = r'(?:[A-Z][A-Za-z0-9.\s]+(?:Inc\.|LLC|Corp\.|Ltd\.|Limited|Technologies|Innovations|Solutions|Group|Company|Associates|Partners|Systems|International|Enterprises))|(?:[A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)+)'
        
        # Enhanced date pattern to catch more date formats
        date_pattern = r'(?i)(?:(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s,]+\d{4}\s*[-–—]\s*(?:Present|Current|Now|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s,]+\d{4}))|(?:\d{1,2}/\d{4}\s*[-–—]\s*(?:Present|\d{1,2}/\d{4}))|(?:\d{4}\s*[-–—]\s*(?:Present|\d{4}))'
        
        # Simpler year range pattern
        year_pattern = r'(?:\b(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2}|Present|Current|Now)\b)'

        lines = text.split('\n')
        in_experience_section = False
        
        # First pass: identify experience section
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Check if this is an experience section header
            if any(header.lower() in line.lower() for header in EXPERIENCE_HEADERS):
                in_experience_section = True
                logger.info(f"Found experience section at line: {line}")
                continue
                
            # Check if we've moved to a different section
            if in_experience_section and any(section in line.lower() for section in ['education', 'projects', 'certifications', 'skills', 'languages', 'references']):
                if current_experience and description_lines:
                    current_experience['description'] = ' '.join(description_lines).strip()
                    experiences.append(current_experience)
                    description_lines = []
                    current_experience = None
                in_experience_section = False
                logger.info(f"Exiting experience section at line: {line}")
                continue
                
            if not in_experience_section:
                continue
                
            # Check for job title
            job_title_match = re.search(job_title_pattern, line)
            
            # Also check for any line that might be a job title (capitalized words followed by a date)
            potential_job_title = False
            if not job_title_match:
                words = line.split()
                if (len(words) >= 2 and 
                    words[0][0].isupper() and 
                    any(title.lower() in line.lower() for title in JOB_TITLES)):
                    potential_job_title = True
                    
            # If we find a job title or potential job title with date
            if job_title_match or potential_job_title or re.search(year_pattern, line):
                # Save previous experience if exists
                if current_experience and description_lines:
                    current_experience['description'] = ' '.join(description_lines).strip()
                    experiences.append(current_experience)
                    description_lines = []
                
                # Create new experience entry
                current_experience = {
                    'position': line.strip(),
                    'company': '',
                    'duration': '',
                    'description': ''
                }
                
                # Extract date if present in the same line
                date_match = re.search(date_pattern, line) or re.search(year_pattern, line)
                if date_match:
                    current_experience['duration'] = date_match.group(0).strip()
                    # Remove the date from position
                    current_experience['position'] = re.sub(date_pattern, '', current_experience['position']).strip()
                    current_experience['position'] = re.sub(year_pattern, '', current_experience['position']).strip()
                
                continue
                
            # Check for company name
            company_match = re.search(company_pattern, line)
            if company_match and current_experience and not current_experience['company']:
                current_experience['company'] = company_match.group(0).strip()
                
                # Check if there's a date on the same line
                date_match = re.search(date_pattern, line) or re.search(year_pattern, line)
                if date_match and not current_experience['duration']:
                    current_experience['duration'] = date_match.group(0).strip()
                continue
                
            # Check for date if not found yet
            date_match = re.search(date_pattern, line) or re.search(year_pattern, line)
            if date_match and current_experience and not current_experience['duration']:
                current_experience['duration'] = date_match.group(0).strip()
                continue
                
            # Add to description
            if current_experience:
                description_lines.append(line)
                
        # Add the last experience if exists
        if current_experience and description_lines:
            current_experience['description'] = ' '.join(description_lines).strip()
            experiences.append(current_experience)
            
        # Post-processing: ensure we have the required fields and extract missing information
        processed_experiences = []
        for exp in experiences:
            # Skip if we don't have position or it's too short
            if not exp['position'] or len(exp['position']) < 3:
                continue
                
            # If no company found, try to extract from position or description
            if not exp['company'] and exp['description']:
                # Try to find company in the first line of description
                first_line = exp['description'].split('.')[0]
                company_match = re.search(company_pattern, first_line)
                if company_match:
                    exp['company'] = company_match.group(0).strip()
                    
            # If still no company, use a placeholder
            if not exp['company']:
                exp['company'] = "Company not specified"
                
            # If no duration found, try to extract from description
            if not exp['duration'] and exp['description']:
                date_match = re.search(date_pattern, exp['description']) or re.search(year_pattern, exp['description'])
                if date_match:
                    exp['duration'] = date_match.group(0).strip()
                    
            # If still no duration, use a placeholder
            if not exp['duration']:
                exp['duration'] = "Duration not specified"
                
            processed_experiences.append(exp)
            
        logger.info(f"Extracted {len(processed_experiences)} experience entries")
        return processed_experiences
        
    except Exception as e:
        logger.error(f"Error extracting experience: {str(e)}")
        return []