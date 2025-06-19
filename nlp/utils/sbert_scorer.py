import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SBERTScorer:
    """
    Class for scoring resume-job description matches using Sentence-BERT.
    This provides better semantic understanding compared to TF-IDF.
    """
    
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """
        Initialize the SBERT scorer with the specified model.
        
        Args:
            model_name (str): Name of the sentence-transformers model to use
        """
        try:
            logger.info(f"Loading SBERT model: {model_name}")
            self.model = SentenceTransformer(model_name)
            logger.info("SBERT model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading SBERT model: {str(e)}")
            raise
    
    def calculate_score(self, resume_text, job_description_text, sections=None):
        """
        Calculate match score between resume and job description using SBERT embeddings.
        
        Args:
            resume_text (str): Full text of the resume
            job_description_text (str): Full text of the job description
            sections (dict, optional): Dict containing resume sections like skills, experience
                                      This allows for weighted section scoring
        
        Returns:
            float: Match score between 0-100
        """
        try:
            # If we have specific sections, use weighted scoring
            if sections and isinstance(sections, dict):
                return self._calculate_weighted_score(sections, job_description_text)
            
            # Otherwise use the full text comparison
            return self._calculate_full_text_score(resume_text, job_description_text)
            
        except Exception as e:
            logger.error(f"Error calculating SBERT score: {str(e)}")
            return 0  # Return 0 score on error
    
    def _calculate_full_text_score(self, resume_text, job_description_text):
        """
        Calculate score using full text comparison.
        
        Args:
            resume_text (str): Full text of the resume
            job_description_text (str): Full text of the job description
            
        Returns:
            float: Match score between 0-100
        """
        # Encode the texts to get embeddings
        resume_embedding = self.model.encode(resume_text)
        job_embedding = self.model.encode(job_description_text)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(
            resume_embedding.reshape(1, -1), 
            job_embedding.reshape(1, -1)
        )[0][0]
        
        # Convert to a 0-100 score
        score = round(max(0, min(100, similarity * 100)))
        logger.info(f"Full text SBERT score: {score}")
        
        return score
    
    def _calculate_weighted_score(self, sections, job_description_text):
        """
        Calculate weighted score using different resume sections.
        
        Args:
            sections (dict): Dictionary with resume sections (skills, experience, etc.)
            job_description_text (str): Full text of the job description
            
        Returns:
            float: Weighted match score between 0-100
        """
        # Define weights for different sections
        weights = {
            'skills': 0.4,
            'experience': 0.3,
            'education': 0.15,
            'projects': 0.15
        }
        
        job_embedding = self.model.encode(job_description_text)
        section_scores = {}
        
        # Calculate score for each section
        for section_name, section_text in sections.items():
            if section_name in weights and section_text:
                # Skip empty sections
                if not section_text.strip():
                    section_scores[section_name] = 0
                    continue
                    
                # Encode section text
                section_embedding = self.model.encode(section_text)
                
                # Calculate similarity
                similarity = cosine_similarity(
                    section_embedding.reshape(1, -1),
                    job_embedding.reshape(1, -1)
                )[0][0]
                
                # Store section score (0-100)
                section_scores[section_name] = max(0, min(100, similarity * 100))
        
        # Calculate weighted score
        total_weight = 0
        weighted_score = 0
        
        for section_name, score in section_scores.items():
            weight = weights.get(section_name, 0)
            weighted_score += score * weight
            total_weight += weight
        
        # Normalize by actual total weight used
        if total_weight > 0:
            final_score = round(weighted_score / total_weight)
        else:
            final_score = 0
            
        logger.info(f"Weighted SBERT score: {final_score}")
        logger.info(f"Section scores: {section_scores}")
        
        return final_score

# Singleton instance for reuse
scorer = None

def get_scorer():
    """Get or create the SBERT scorer instance"""
    global scorer
    if scorer is None:
        scorer = SBERTScorer()
    return scorer

def calculate_match_score(resume_text, job_description_text, resume_sections=None):
    """
    Calculate match score between resume and job description.
    
    Args:
        resume_text (str): Full text of the resume
        job_description_text (str): Full text of the job description
        resume_sections (dict, optional): Resume sections for weighted scoring
        
    Returns:
        float: Match score between 0-100
    """
    scorer = get_scorer()
    return scorer.calculate_score(resume_text, job_description_text, resume_sections) 