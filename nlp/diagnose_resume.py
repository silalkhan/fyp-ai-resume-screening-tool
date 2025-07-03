#!/usr/bin/env python3
"""
Resume Processing Diagnostic Tool

This script helps diagnose issues with resume processing by testing each step
of the processing pipeline independently and providing detailed debugging.
"""

import os
import sys
import argparse
import logging
import traceback
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("resume_diagnoser")

def analyze_file(file_path):
    """Analyze basic file properties and contents"""
    print("\n=== File Analysis ===")
    
    if not os.path.exists(file_path):
        print(f"ERROR: File not found: {file_path}")
        return False
    
    # Basic file info
    file_size = os.path.getsize(file_path)
    file_extension = os.path.splitext(file_path)[1].lower()
    
    print(f"File path: {file_path}")
    print(f"File size: {file_size} bytes")
    print(f"File type: {file_extension}")
    
    # Check if file is readable
    try:
        with open(file_path, 'rb') as f:
            header_bytes = f.read(20)
            print(f"File header (hex): {header_bytes.hex()}")
            
            if file_extension == '.pdf' and not header_bytes.startswith(b'%PDF'):
                print("WARNING: File does not start with PDF signature")
            elif file_extension == '.docx' and not header_bytes.startswith(b'PK'):
                print("WARNING: File does not start with DOCX/ZIP signature")
                
    except Exception as e:
        print(f"ERROR: Could not read file: {e}")
        return False
    
    return True

def test_text_extraction(file_path):
    """Test text extraction from the resume"""
    print("\n=== Text Extraction Test ===")
    
    try:
        from utils.extract_text import extract_text
        
        print("Attempting text extraction...")
        extracted_text = extract_text(file_path)
        
        if not extracted_text:
            print("ERROR: No text extracted from file!")
            return None
        
        print(f"SUCCESS! Extracted {len(extracted_text)} characters")
        print("\nText preview (first 200 chars):")
        print("-" * 50)
        print(extracted_text[:200] + ("..." if len(extracted_text) > 200 else ""))
        print("-" * 50)
        
        # Analyze text content
        lines = extracted_text.split('\n')
        words = extracted_text.split()
        unique_words = set(word.lower() for word in words)
        
        print(f"Text statistics:")
        print(f"- {len(lines)} lines")
        print(f"- {len(words)} total words")
        print(f"- {len(unique_words)} unique words")
        print(f"- {len(extracted_text)} total characters")
        
        return extracted_text
        
    except ImportError as e:
        print(f"ERROR: Missing required module: {str(e)}")
        return None
    except Exception as e:
        print(f"ERROR: Text extraction failed: {str(e)}")
        print(traceback.format_exc())
        return None

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Resume processing diagnostic tool')
    parser.add_argument('file_path', help='Path to resume file (PDF or DOCX)')
    
    args = parser.parse_args()
    
    print("=== Resume Processing Diagnostic Tool ===")
    print(f"Testing file: {args.file_path}")
    
    # 1. Analyze file
    file_valid = analyze_file(args.file_path)
    if not file_valid:
        print("File analysis failed. Exiting.")
        return 1
    
    # 2. Extract text
    text = test_text_extraction(args.file_path)
    if not text:
        print("Text extraction failed. Exiting.")
        return 1
    
    print("\n=== Diagnostic Complete ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
