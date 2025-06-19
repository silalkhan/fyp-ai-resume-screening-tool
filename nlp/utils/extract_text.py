import os
import logging
import re
import tempfile
import subprocess
from io import StringIO

# Configure logging
logger = logging.getLogger(__name__)

# Import potentially problematic modules inside functions to avoid initialization errors
def _load_pdf_module():
    try:
        from PyPDF2 import PdfReader
        return PdfReader
    except ImportError:
        logger.warning("PyPDF2 not available, PDF extraction may be limited")
        return None

def _load_docx_module():
    try:
        import docx
        return docx
    except ImportError:
        logger.warning("python-docx not available, DOCX extraction may be limited")
        return None

def extract_text(file_path):
    """
    Extract text from resume file (PDF or DOCX)
    
    Args:
        file_path: Path to the resume file
        
    Returns:
        Extracted text or None if extraction failed
    """
    try:
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None
            
        file_extension = os.path.splitext(file_path)[1].lower()
        logger.info(f"Extracting text from {file_path} with extension {file_extension}")
        
        # PDF extraction
        if file_extension == '.pdf':
            return extract_text_from_pdf(file_path)
        # DOCX extraction
        elif file_extension == '.docx':
            return extract_text_from_docx(file_path)
        else:
            logger.error(f"Unsupported file format: {file_extension}")
            return None
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def extract_text_from_pdf(file_path):
    """Extract text from PDF using multiple methods for robustness"""
    text = ""
    
    # First try PyPDF2
    try:
        logger.info(f"Extracting text from PDF using PyPDF2: {file_path}")
        PdfReader = _load_pdf_module()
        if not PdfReader:
            raise ImportError("PyPDF2 not available")
            
        with open(file_path, 'rb') as f:
            reader = PdfReader(f)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        
        # If we got reasonable text, return it
        if len(text.strip()) > 100:
            logger.info(f"Successfully extracted {len(text)} characters with PyPDF2")
            return clean_text(text)
    except Exception as e:
        logger.warning(f"PyPDF2 extraction failed: {str(e)}")
    
    # If PyPDF2 failed or extracted too little text, try pdftotext if available
    try:
        logger.info(f"Trying pdftotext for {file_path}")
        with tempfile.NamedTemporaryFile(suffix='.txt') as temp_txt:
            # Try to use pdftotext command line tool if available
            result = subprocess.run(
                ['pdftotext', '-layout', file_path, temp_txt.name],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                with open(temp_txt.name, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
                
                if len(text.strip()) > 0:
                    logger.info(f"Successfully extracted {len(text)} characters with pdftotext")
                    return clean_text(text)
            else:
                logger.warning(f"pdftotext failed: {result.stderr}")
    except (FileNotFoundError, subprocess.SubprocessError) as e:
        logger.warning(f"pdftotext extraction failed: {str(e)}")
    
    # If we have some text from PyPDF2 but it's not ideal, return it anyway
    if len(text.strip()) > 0:
        logger.info(f"Returning partial text ({len(text)} chars) from PyPDF2")
        return clean_text(text)
    
    logger.error(f"Failed to extract text from PDF: {file_path}")
    return None

def extract_text_from_docx(file_path):
    """Extract text from DOCX file with multiple fallback methods"""
    text = ""
    
    # Method 1: python-docx library
    try:
        logger.info(f"Extracting text from DOCX using python-docx: {file_path}")
        docx = _load_docx_module()
        if not docx:
            raise ImportError("python-docx not available")
            
        doc = docx.Document(file_path)
        
        # Extract paragraphs
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        
        # Extract tables
        tables_text = []
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text for cell in row.cells if cell.text.strip()]
                if row_text:
                    tables_text.append(' | '.join(row_text))
        
        # Combine text
        text = '\n'.join(paragraphs)
        if tables_text:
            text += '\n\n' + '\n'.join(tables_text)
            
        if len(text.strip()) > 100:
            logger.info(f"Successfully extracted {len(text)} characters from DOCX using python-docx")
            return clean_text(text)
    except Exception as e:
        logger.warning(f"python-docx extraction failed: {str(e)}")
    
    # Fallback Method 2: Try using textract if available
    if not text.strip() or len(text.strip()) < 100:
        try:
            import textract
            logger.info(f"Trying textract for DOCX extraction: {file_path}")
            extracted_text = textract.process(file_path).decode('utf-8', errors='ignore')
            if extracted_text and len(extracted_text.strip()) > 0:
                logger.info(f"Successfully extracted {len(extracted_text)} characters using textract")
                return clean_text(extracted_text)
        except ImportError:
            logger.warning("textract not available for DOCX extraction fallback")
        except Exception as e:
            logger.warning(f"textract extraction failed: {str(e)}")
    
    # Fallback Method 3: Try using docx2txt if available
    if not text.strip() or len(text.strip()) < 100:
        try:
            import docx2txt
            logger.info(f"Trying docx2txt for DOCX extraction: {file_path}")
            extracted_text = docx2txt.process(file_path)
            if extracted_text and len(extracted_text.strip()) > 0:
                logger.info(f"Successfully extracted {len(extracted_text)} characters using docx2txt")
                return clean_text(extracted_text)
        except ImportError:
            logger.warning("docx2txt not available for DOCX extraction fallback")
        except Exception as e:
            logger.warning(f"docx2txt extraction failed: {str(e)}")
    
    # If we got at least something from python-docx, return that
    if text.strip():
        logger.info(f"Returning partial text ({len(text)} chars) from python-docx")
        return clean_text(text)
    
    logger.error(f"All DOCX extraction methods failed for: {file_path}")
    return None

def clean_text(text):
    """Clean and normalize extracted text"""
    if not text:
        return ""
        
    # Remove non-printable characters
    text = ''.join(c for c in text if c.isprintable() or c in '\n\t')
    
    # Replace tabs with spaces
    text = text.replace('\t', ' ')
    
    # Replace multiple newlines with a single newline
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove excessive whitespace within lines
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        clean_lines.append(' '.join(word for word in line.split() if word))
    
    # Rejoin with newlines
    text = '\n'.join(clean_lines)
    
    # Remove very long tokens (likely garbage)
    text = ' '.join(word for word in text.split() if len(word) < 30)
    
    return text.strip()

# Add a standalone test function for direct invocation
def test_extraction(file_path):
    """Test extraction on a specific file and print results"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
        
    print(f"Testing extraction on: {file_path}")
    extracted_text = extract_text(file_path)
    
    if extracted_text:
        print(f"Successfully extracted {len(extracted_text)} characters")
        print("\nPreview (first 500 chars):")
        print("-" * 80)
        print(extracted_text[:500] + ("..." if len(extracted_text) > 500 else ""))
        print("-" * 80)
        return True
    else:
        print("Extraction failed!")
        return False

# Allow running as standalone script for testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python extract_text.py <file_path>")
        sys.exit(1)
    
    success = test_extraction(sys.argv[1])
    sys.exit(0 if success else 1)