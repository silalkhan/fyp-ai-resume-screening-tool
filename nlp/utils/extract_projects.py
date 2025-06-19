import spacy
import re
import logging

nlp = spacy.load('en_core_web_sm')

def extract_projects(resume_text):
    """
    Extract project details from resume text.
    
    Args:
        resume_text: The resume text to extract projects from
        
    Returns:
        List of dictionaries containing project details:
        - title: Project title
        - description: Project description
        - technologies: List of technologies used
        - duration: Project duration
    """
    try:
        doc = nlp(resume_text)
        projects = []
        project_pattern = r'(?:project|work|developed)\s*:\s*([\w\s]+?)(?:\s*(?:,|\(|from)?\s*(\d{4}\s*-\s*(?:\d{4}|present)))?(?:\s*using\s*([\w\s,]+))?'

        # Extract structured project information
        matches = re.finditer(project_pattern, resume_text, re.IGNORECASE)
        for match in matches:
            title = match.group(1).strip()
            duration = match.group(2).strip() if match.group(2) else ''
            technologies = match.group(3).split(',') if match.group(3) else []
            technologies = [t.strip() for t in technologies if t.strip()]
            projects.append({
                'title': title,
                'description': '',
                'technologies': technologies,
                'duration': duration
            })

        # Extract project descriptions from sentences
        for sent in doc.sents:
            if any(word in sent.text.lower() for word in ['project', 'developed', 'built', 'created', 'implemented']):
                # Check if this might be part of an existing project
                is_new_project = True
                for project in projects:
                    if project['title'].lower() in sent.text.lower():
                        if not project['description']:
                            project['description'] = sent.text.strip()
                        is_new_project = False
                        break
                
                if is_new_project:
                    description = sent.text.strip()
                    # Try to extract technologies from the description
                    tech_pattern = r'using\s+([\w\s,]+)(?:and|,|\.|$)'
                    tech_match = re.search(tech_pattern, description, re.IGNORECASE)
                    technologies = []
                    if tech_match:
                        technologies = [t.strip() for t in tech_match.group(1).split(',') if t.strip()]
                    
                    projects.append({
                        'title': '',
                        'description': description,
                        'technologies': technologies,
                        'duration': ''
                    })

        # Remove duplicates while preserving order
        seen = set()
        unique_projects = []
        for project in projects:
            project_tuple = tuple(sorted(project.items()))
            if project_tuple not in seen:
                seen.add(project_tuple)
                unique_projects.append(project)

        return unique_projects

    except Exception as e:
        logging.error(f"Error extracting projects: {str(e)}")
        return []
