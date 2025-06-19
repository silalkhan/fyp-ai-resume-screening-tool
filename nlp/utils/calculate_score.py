from sentence_transformers import SentenceTransformer, util
import numpy as np
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load SBERT model
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("SBERT model loaded successfully")
except Exception as e:
    logger.error(f"Error loading SBERT model: {str(e)}")
    model = None
    model = None

# Map frontend/backend category names to internal NLP category keys
CATEGORY_MAPPING = {
    'UET Peshawar': 'uet_peshawar',
    'Cybersecurity': 'cybersecurity',
    'Web Developer': 'web_developer',
    'Python Developer': 'python_developer',
    'Software Engineer': 'software_engineer'
}

# Job categories and their specific keywords
JOB_CATEGORIES = {
    'uet_peshawar': {
        'keywords': [
            'phd', 'doctorate', 'doctoral', 'professor', 'lecturer', 'teaching', 'research', 
            'publication', 'publish', 'journal', 'faculty', 'university', 'academic', 
            'thesis', 'dissertation', 'curriculum', 'pedagogy', 'course', 'classroom',
            'education', 'degree', 'masters', 'mphil', 'conference', 'seminar', 'workshop',
            'present', 'presentation', 'department', 'college', 'scholar', 'fellowship',
            'grant', 'research project', 'laboratory', 'lab', 'supervision', 'mentor',
            'peshawar', 'uet', 'engineering', 'teaching assistant', 'ta', 'research assistant',
            'ra', 'higher education', 'hec', 'pakistan', 'khyber pakhtunkhwa'
        ],
        'weights': {'text_similarity': 0.35, 'skill_match': 0.35, 'keyword_match': 0.3}
    },
    'cybersecurity': {
        'keywords': [
            'security', 'cybersecurity', 'cyber security', 'penetration testing', 'pentest',
            'vulnerability', 'threat', 'malware', 'incident response', 'forensics', 'firewall',
            'encryption', 'cryptography', 'network security', 'security audit', 'ethical hacking',
            'siem', 'intrusion detection', 'security operations', 'soc', 'compliance', 'iso 27001'
        ],
        'weights': {'text_similarity': 0.4, 'skill_match': 0.5, 'keyword_match': 0.1}
    },
    'web_developer': {
        'keywords': [
            'frontend', 'backend', 'full stack', 'web development', 'react', 'angular', 'vue',
            'node.js', 'express', 'django', 'flask', 'api', 'rest', 'graphql', 'database',
            'mongodb', 'postgresql', 'mysql', 'redis', 'aws', 'docker', 'kubernetes'
        ],
        'weights': {'text_similarity': 0.4, 'skill_match': 0.5, 'keyword_match': 0.1}
    },
    'python_developer': {
        'keywords': [
            'python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy', 'scikit-learn',
            'pytest', 'unittest', 'api', 'sql', 'orm', 'data analysis', 'automation', 'scripting'
        ],
        'weights': {'text_similarity': 0.4, 'skill_match': 0.5, 'keyword_match': 0.1}
    },
    'software_engineer': {
        'keywords': [
            'software development', 'programming', 'algorithms', 'data structures', 'system design',
            'architecture', 'ci/cd', 'testing', 'agile', 'scrum', 'git', 'debugging', 'optimization'
        ],
        'weights': {'text_similarity': 0.4, 'skill_match': 0.5, 'keyword_match': 0.1}
    }
}

def normalize_job_category(category):
    """
    Convert frontend/backend category name to internal NLP category key
    """
    if not category:
        return 'software_engineer'  # default category
        
    # If it's already an internal key, return it
    if category in JOB_CATEGORIES:
        return category
        
    # Try to map from frontend/backend name to internal key
    return CATEGORY_MAPPING.get(category, 'software_engineer')

def detect_job_category(job_description):
    """
    Detect the job category from the job description
    """
    if not job_description:
        return 'software_engineer'  # default category

    job_lower = job_description.lower()
    
    # First check for UET Peshawar lecturer position
    if ('uet peshawar' in job_lower or 'university of engineering and technology peshawar' in job_lower) and any(word in job_lower for word in ['lecturer', 'professor', 'faculty']):
        return 'uet_peshawar'
        
    # Then check for other categories
    category_scores = {}
    for category, data in JOB_CATEGORIES.items():
        score = sum(1 for kw in data['keywords'] if kw in job_lower)
        category_scores[category] = score
    
    if not category_scores:
        return 'software_engineer'  # default category
        
    return max(category_scores.items(), key=lambda x: x[1])[0]

def calculate_match_score(resume_text, job_description, resume_skills, job_skills, job_category=None):
    """
    Calculate match score between resume and job description
    
    Args:
        resume_text: The resume text
        job_description: The job description text
        resume_skills: List of skills extracted from the resume
        job_skills: List of required skills for the job
        job_category: Optional job category (will be detected from description if not provided)
    
    Returns:
        Match score (0-100)
    """
    try:
        if not resume_text or not resume_text.strip():
            logger.warning("Empty resume text provided")
            return 20  # Return low score for empty resume
            
        if not job_description:
            logger.warning("Empty job description provided")
            return 30  # Return low-medium score for empty job description
        
        # Log inputs for debugging
        logger.info(f"Calculating match score for resume length: {len(resume_text)} chars")
        logger.info(f"Job description length: {len(job_description)} chars")
        logger.info(f"Resume skills: {resume_skills}")
        logger.info(f"Job skills: {job_skills}")
        logger.info(f"Provided job category: {job_category}")
        
        score = 0.0
        
        # Detect or normalize job category
        if job_category:
            job_category = normalize_job_category(job_category)
            logger.info(f"Normalized job category: {job_category}")
        else:
            job_category = detect_job_category(job_description)
            logger.info(f"Detected job category: {job_category}")
            
        category_data = JOB_CATEGORIES[job_category]
        weights = category_data['weights']
        
        # Calculate text similarity using SBERT
        text_similarity_score = 0
        if job_description and resume_text and model is not None:
            # Clean and normalize text
            clean_resume = ' '.join(resume_text.lower().split())
            clean_job = ' '.join(job_description.lower().split())
            
            # Encode and calculate similarity
            try:
                embeddings = model.encode([clean_resume, clean_job], convert_to_tensor=True)
                similarity = float(util.cos_sim(embeddings[0], embeddings[1]).item())
                text_similarity_score = similarity * 100
                logger.info(f"Text similarity score: {text_similarity_score:.2f}")
            except Exception as e:
                logger.error(f"Error calculating SBERT similarity: {str(e)}")
                # Fallback to basic word matching if SBERT fails
                resume_words = set(clean_resume.split())
                job_words = set(clean_job.split())
                common_words = resume_words.intersection(job_words)
                text_similarity_score = len(common_words) / len(job_words) * 50 if job_words else 30
                logger.info(f"Fallback text similarity score: {text_similarity_score:.2f}")
        else:
            logger.warning("Missing inputs for text similarity calculation or model not loaded")
            text_similarity_score = 30  # Default fallback score
        
        score += weights['text_similarity'] * text_similarity_score
        
        # Calculate skill match ratio
        skill_match_score = 0
        if job_skills and resume_skills:
            # Consider partial matches (case insensitive)
            job_skills_lower = [s.lower() for s in job_skills]
            resume_skills_lower = [s.lower() for s in resume_skills]
            
            # Exact matches
            matched_skills = set(resume_skills_lower).intersection(set(job_skills_lower))
            
            # Partial matches (e.g., "JavaScript" matches "JavaScript React")
            partial_matches = set()
            for job_skill in job_skills_lower:
                for resume_skill in resume_skills_lower:
                    if job_skill in resume_skill and job_skill not in matched_skills:
                        partial_matches.add(job_skill)
                    elif resume_skill in job_skill and resume_skill not in matched_skills:
                        partial_matches.add(resume_skill)
            
            # Calculate score with full and partial matches
            full_match_count = len(matched_skills)
            partial_match_count = len(partial_matches) * 0.5  # Partial matches count as half
            total_match_count = full_match_count + partial_match_count
            
            skill_match_ratio = total_match_count / len(job_skills) if job_skills else 0
            skill_match_score = skill_match_ratio * 100
            logger.info(f"Skill match score: {skill_match_score:.2f} (matched {full_match_count} full, {len(partial_matches)} partial)")
        else:
            logger.warning("Missing skills for match calculation")
            skill_match_score = 25  # Default fallback score
            
        score += weights['skill_match'] * skill_match_score
        
        # Calculate keyword match for the specific job category
        keyword_score = 0
        if resume_text:
            resume_lower = resume_text.lower()
            matched_keywords = sum(1 for kw in category_data['keywords'] if kw in resume_lower)
            keyword_density = matched_keywords / len(category_data['keywords'])
            keyword_score = keyword_density * 100
            logger.info(f"Keyword match score: {keyword_score:.2f} (matched {matched_keywords}/{len(category_data['keywords'])})")
        
            # Special handling for UET Peshawar positions
            if job_category == 'uet_peshawar':
                # Bonus for PhDs in academic positions
                if re.search(r'\b(?:phd|ph\.d|doctorate|doctoral)\b', resume_lower):
                    keyword_score = min(keyword_score + 20, 100)
                    logger.info("Applied PhD bonus for UET position")
                # Bonus for research publications
                if re.search(r'\b(?:journal|publication|published|research paper)\b', resume_lower):
                    keyword_score = min(keyword_score + 10, 100)
                    logger.info("Applied research publication bonus for UET position")
                # Bonus for teaching experience
                if re.search(r'\b(?:teaching|lecturer|professor|instructor)\b', resume_lower):
                    keyword_score = min(keyword_score + 10, 100)
                    logger.info("Applied teaching experience bonus for UET position")
                    # Bonus for Pakistan/UET Peshawar experience
                    if re.search(r'\b(?:pakistan|peshawar|uet|khyber|pakhtunkhwa)\b', resume_lower):
                        keyword_score = min(keyword_score + 15, 100)
                        logger.info("Applied Pakistan/UET experience bonus")

        score += weights['keyword_match'] * keyword_score

        # Apply variability to avoid always returning the same score
        # Add slight randomness based on hash of resume text to ensure deterministic but varied scores
        # for similar quality resumes
        hash_value = sum(ord(c) for c in resume_text[:100]) % 10
        variability = (hash_value - 5) * 0.5  # -2.5 to +2.5 range
        
        final_score = min(round(score + variability, 1), 100.0)
        final_score = max(final_score, 15.0)  # Minimum score floor
        
        logger.info(f"Final match score: {final_score:.1f}")
        return final_score
    except Exception as e:
        logger.error(f"Error calculating match score: {str(e)}")
        return 35.0  # Default score in case of errors

def detect_duplicate(resume_text, existing_resume_texts):
    """
    Detect if a resume is a duplicate of existing resumes
    
    Args:
        resume_text: The current resume text
        existing_resume_texts: List of existing resume texts to compare against
        
    Returns:
        Tuple of (is_duplicate, duplicate_indices)
    """
    try:
        if not existing_resume_texts:
            return False, []

        if not model:
            logger.warning("SBERT model not loaded, using fallback duplicate detection")
            # Fallback method - simple text comparison
            duplicate_indices = []
            for i, existing_text in enumerate(existing_resume_texts):
                if len(resume_text) > 0 and len(existing_text) > 0:
                    similarity = len(set(resume_text.split()) & set(existing_text.split())) / len(set(resume_text.split() + existing_text.split()))
                    if similarity > 0.9:  # 90% similarity threshold
                        duplicate_indices.append(i)
            return len(duplicate_indices) > 0, duplicate_indices

        resume_embedding = model.encode(resume_text, convert_to_tensor=True)
        existing_embeddings = model.encode(existing_resume_texts, convert_to_tensor=True)
        similarities = util.cos_sim(resume_embedding, existing_embeddings)[0]

        threshold = 0.95
        duplicate_indices = [i for i, sim in enumerate(similarities) if sim > threshold]

        return len(duplicate_indices) > 0, duplicate_indices
    except Exception as e:
        logger.error(f"Error detecting duplicates: {str(e)}")
        return False, []