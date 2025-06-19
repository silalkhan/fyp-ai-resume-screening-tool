import re
import spacy
from datetime import datetime

nlp = spacy.load('en_core_web_sm')

# Common degrees
DEGREES = [
    # PhD level
    "phd", "ph.d.", "ph.d", "doctor of philosophy", "doctorate", "doctoral",
    # Master's level
    "master", "masters", "m.s.", "ms", "m.a.", "ma", "m.eng", "meng", "m.tech", "mtech",
    "m.b.a.", "mba", "m.phil", "mphil", "m.sc", "msc", "m.c.a", "mca", "ll.m", "llm",
    # Bachelor's level
    "bachelor", "bachelors", "b.s.", "bs", "b.a.", "ba", "b.eng", "beng", "b.tech", "btech",
    "b.sc", "bsc", "b.com", "bcom", "ll.b", "llb", "b.e.", "be", "b.c.a", "bca",
    # Associate level
    "associate", "a.a.", "aa", "a.s.", "as", "a.a.s.", "aas",
    # Other academic qualifications
    "diploma", "certificate", "certification", "post graduate", "postgraduate"
]

# Education section headers
EDUCATION_HEADERS = [
    "education", "educational background", "academic background", "academic qualifications",
    "academic history", "qualifications", "degrees", "academic credentials"
]

def extract_education(text):
    """
    Extract education information from resume text
    
    Returns:
        List of dictionaries with education information
    """
    # Check if text is empty
    if not text or len(text.strip()) == 0:
        return []
    
    education_list = []
    
    # Pre-process text to identify sections
    lines = text.split('\n')
    education_section = False
    education_text = ""
    
    # Try to find education section
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        if any(header in line_lower for header in EDUCATION_HEADERS) or (
            i > 0 and any(degree in line_lower for degree in DEGREES)
        ):
            education_section = True
            education_text += line + "\n"
        elif education_section:
            # Check if we've moved to a new section
            if line_lower and len(line_lower) < 30 and line_lower.endswith(':'):
                education_section = False
            else:
                education_text += line + "\n"
    
    # If no education section found, use the entire text
    if not education_text:
        education_text = text
    
    # Process with NLP
    doc = nlp(education_text)
    
    # Extract sentences that contain degree keywords
    degree_sentences = []
    for sent in doc.sents:
        sent_text = sent.text.lower()
        if any(degree in sent_text for degree in DEGREES):
            degree_sentences.append(sent.text)
    
    # If no sentences found with degree keywords, try broader patterns
    if not degree_sentences:
        for sent in doc.sents:
            sent_text = sent.text.lower()
            if any(word in sent_text for word in ["university", "college", "institute", "school"]):
                degree_sentences.append(sent.text)
    
    # Extract education details from sentences
    for sentence in degree_sentences:
        # Try to extract degree
        degree = ""
        for d in DEGREES:
            pattern = r"\b" + re.escape(d) + r"\b"
            match = re.search(pattern, sentence.lower())
            if match:
                degree = match.group()
                break
        
        # Try to extract field of study
        field = ""
        field_patterns = [
            r"(?:in|of) ([A-Za-z\s]+?)(?:from|at|,|\.|$)",
            r"(?:degree|diploma) (?:in|of) ([A-Za-z\s]+?)(?:from|at|,|\.|$)"
        ]
        
        for pattern in field_patterns:
            match = re.search(pattern, sentence)
            if match:
                field = match.group(1).strip()
                break
        
        # Try to extract institution
        institution = ""
        for org in doc.ents:
            if org.label_ == "ORG" and org.text in sentence:
                institution = org.text
                break
        
        if not institution:
            # Fallback to regex patterns for institutions
            inst_patterns = [
                r"(?:from|at) (?:the )?([A-Z][A-Za-z\s]+? (?:University|College|Institute|School))",
                r"([A-Z][A-Za-z\s]+? (?:University|College|Institute|School))"
            ]
            
            for pattern in inst_patterns:
                match = re.search(pattern, sentence)
                if match:
                    institution = match.group(1).strip()
                    break
        
        # Try to extract year
        year = ""
        year_pattern = r"\b(19|20)\d{2}\b"
        match = re.search(year_pattern, sentence)
        if match:
            year = match.group()
        
        # Only add if we have at least a degree or institution
        if degree or institution:
            education_list.append({
                "institution": institution,
                "degree": degree.title() if degree else "",
                "field": field,
                "year": year
            })
    
    # If we still don't have results, try to extract from a general approach
    if not education_list:
        institution_pattern = r"([A-Z][A-Za-z\s]+? (?:University|College|Institute|School))"
        institutions = re.findall(institution_pattern, text)
        
        for institution in institutions:
            education_list.append({
                "institution": institution,
                "degree": "",
                "field": "",
                "year": ""
            })
    
    return education_list