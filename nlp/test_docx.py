#!/usr/bin/env python3
"""
Test script specifically for DOCX extraction
"""

import os
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_docx_extraction(file_path):
    """Test extraction for a DOCX file"""
    print(f"Testing DOCX extraction on: {file_path}")
    
    try:
        # Import only when needed to isolate issues
        from utils.extract_text import extract_text
        
        if not os.path.exists(file_path):
            print(f"ERROR: File not found: {file_path}")
            return False
        
        # First check file extension
        if not file_path.lower().endswith('.docx'):
            print(f"WARNING: File does not have .docx extension: {file_path}")
        
        # Test extraction
        print("Attempting text extraction...")
        extracted_text = extract_text(file_path)
        
        if not extracted_text:
            print("ERROR: No text extracted from file!")
            return False
        
        print(f"SUCCESS! Extracted {len(extracted_text)} characters")
        print("\nText preview (first 200 chars):")
        print("-" * 50)
        print(extracted_text[:200] + ("..." if len(extracted_text) > 200 else ""))
        print("-" * 50)
        return True
        
    except ImportError as e:
        print(f"ERROR: Missing required module: {str(e)}")
        return False
    except Exception as e:
        print(f"ERROR: Extraction failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python test_docx.py <path_to_docx_file>")
        return 1
    
    file_path = sys.argv[1]
    success = test_docx_extraction(file_path)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 