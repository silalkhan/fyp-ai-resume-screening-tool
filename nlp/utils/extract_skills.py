import spacy
import re
import logging
from collections import Counter
from spacy.matcher import PhraseMatcher

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_sm')
    logger.info("Loaded spaCy model successfully")
except Exception as e:
    logger.error(f"Error loading spaCy model: {str(e)}")
    nlp = None

# Common tech skills
COMMON_TECH_SKILLS = [
    'python', 'java', 'javascript', 'react', 'node.js', 'nodejs', 'vue', 'angular',
    'html', 'css', 'mongodb', 'mysql', 'postgresql', 'sql', 'nosql',
    'express', 'django', 'flask', 'php', 'laravel', 'spring', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'cloud', 'devops', 'ci/cd',
    'git', 'github', 'gitlab', 'rest api', 'graphql', 'typescript',
    'machine learning', 'data science', 'artificial intelligence', 'ai', 'ml',
    'nlp', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'numpy', 'pandas',
    'data analysis', 'data visualization', 'tableau', 'power bi', 'excel',
    'frontend', 'backend', 'full stack', 'mobile', 'ios', 'android', 'react native',
    'flutter', 'swift', 'kotlin', 'c++', 'c#', '.net', 'ruby', 'rails',
    'agile', 'scrum', 'jira', 'confluence', 'jenkins', 'cybersecurity', 'security',
    'penetration testing', 'ethical hacking', 'malware analysis', 'incident response',
    'firewall', 'encryption', 'vpn', 'authentication', 'authorization',
]

# Academic and teaching skills for lectureship positions
ACADEMIC_SKILLS = [
    'teaching', 'lecturing', 'research', 'curriculum development', 'academic writing',
    'course design', 'assessment', 'pedagogy', 'instructional design', 'student mentoring',
    'phd', 'doctorate', 'masters', 'ms', 'mphil', 'thesis supervision', 'grant writing',
    'academic publishing', 'scholarly activity', 'peer review', 'journal publication',
    'conference presentation', 'workshop facilitation', 'lab supervision',
    'classroom management', 'online teaching', 'lms', 'blackboard', 'moodle', 'canvas',
    'education technology', 'higher education', 'academic administration', 'faculty development',
]

def extract_skills(text, job_required_skills=None):
    """
    Extract skills from resume text
    
    Args:
        text: The resume text
        job_required_skills: List of required skills for the job
        
    Returns:
        List of extracted skills
    """
    # Check if text is empty
    if not text or len(text.strip()) == 0:
        logger.warning("Empty text provided for skills extraction")
        return []
        
    text = text.lower()
    
    logger.info(f"Extracting skills from text of length {len(text)}")    
        
    # Combine all skill lists and job-required skills
    all_skills = set(COMMON_TECH_SKILLS + ACADEMIC_SKILLS)
    
    if job_required_skills and isinstance(job_required_skills, list):
        # Clean and normalize the job required skills
        cleaned_job_skills = [skill.lower().strip() for skill in job_required_skills if skill.strip()]
        all_skills.update(cleaned_job_skills)
        logger.info(f"Added {len(cleaned_job_skills)} job-specific skills to the skills corpus")
    
    extracted_skills = []
    
    # Method 1: Use spaCy for multi-token skills
    if nlp:
        try:
            # Create skill patterns for the matcher
            skill_patterns = list(nlp.pipe([skill for skill in all_skills if ' ' in skill]))
            
            matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
            for skill in skill_patterns:
                matcher.add(skill.text, None, skill)
            
            # Process the text
            doc = nlp(text)
            
            # Find matches
            matches = matcher(doc)
            for match_id, start, end in matches:
                span = doc[start:end]
                skill_text = span.text.lower()
                if skill_text not in extracted_skills:
                    extracted_skills.append(skill_text)
                    
            logger.info(f"Extracted {len(extracted_skills)} multi-token skills with spaCy matcher")
        except Exception as e:
            logger.error(f"Error in spaCy skills extraction: {str(e)}")
    
    # Method 2: Use regex pattern matching for all skills (single and multi-token)
    for skill in all_skills:
        try:
            # Create word boundary pattern, handling special characters
            skill_pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(skill_pattern, text):
                if skill not in extracted_skills:
                    extracted_skills.append(skill)
        except Exception as e:
            logger.warning(f"Error matching skill '{skill}': {str(e)}")
    
    logger.info(f"Total extracted skills: {len(extracted_skills)}")
    
    # Remove any duplicates and normalize skill names
    normalized_skills = []
    for skill in extracted_skills:
        # Normalize skill format (capitalize product names, etc.)
        normalized = skill
        if skill in ['javascript', 'typescript']:
            normalized = skill.capitalize()
        elif skill in ['react', 'vue', 'angular']:
            normalized = skill.capitalize()
        elif skill == 'nodejs':
            normalized = 'Node.js'
        elif skill == 'python':
            normalized = 'Python'
        
        if normalized not in normalized_skills:
            normalized_skills.append(normalized)
    
    return normalized_skills