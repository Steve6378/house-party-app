# Yorru - PDF Text Extraction Service
# Version: 0.0.1
# Based on labb10 pdf_scraper.py

from pypdf import PdfReader
import pdfplumber
from typing import Optional


def extract_text_from_pdf(pdf_path: str) -> Optional[str]:
    """
    Extract text from a PDF file using multiple methods.

    Tries pypdf first, falls back to pdfplumber if needed.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Extracted text as a single string, or None if extraction fails
    """
    try:
        # Method 1: Try pypdf (faster, simpler)
        reader = PdfReader(pdf_path)
        text_parts = []

        for page_num, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"[Page {page_num}]\n{page_text}\n")

        if text_parts:
            return "\n".join(text_parts)

    except Exception as e:
        print(f"pypdf extraction failed: {e}, trying pdfplumber...")

    try:
        # Method 2: Fallback to pdfplumber (better for complex layouts)
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"[Page {page_num}]\n{page_text}\n")

        if text_parts:
            return "\n".join(text_parts)

    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
        return None

    return None


def extract_text_from_file(file_path: str, file_type: str) -> Optional[str]:
    """
    Extract text from various file types.

    Args:
        file_path: Path to the file
        file_type: File extension (pdf, txt, etc.)

    Returns:
        Extracted text or None
    """
    file_type = file_type.lower().replace(".", "")

    if file_type == "pdf":
        return extract_text_from_pdf(file_path)

    elif file_type == "txt":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Failed to read text file: {e}")
            return None

    else:
        print(f"Unsupported file type: {file_type}")
        return None
