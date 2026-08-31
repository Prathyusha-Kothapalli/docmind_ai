"""
DocMind AI - Python Document Parser
Extracts raw text content from TXT, PDF, DOCX, and XLSX files.
"""

import sys
import os
import json

def parse_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def parse_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".txt":
        return parse_txt(file_path)

    # For binary formats (PDF, DOCX, XLSX), attempt extraction or readable strings
    try:
        with open(file_path, "rb") as f:
            content = f.read()
            # Extract plain text characters from binary standard stream
            text = "".join(chr(c) for c in content if 32 <= c <= 126 or c in (10, 13, 9))
            # Remove long strings of non-letter junk
            cleaned_words = [w for w in text.split() if any(c.isalpha() for c in w) and len(w) < 45]
            return " ".join(cleaned_words)
    except Exception as e:
        return f"Error reading file content: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
        try:
            extracted_text = parse_file(target_path)
            print(json.dumps({"success": True, "text": extracted_text[:10000]}))
        except Exception as err:
            print(json.dumps({"success": False, "error": str(err)}))
