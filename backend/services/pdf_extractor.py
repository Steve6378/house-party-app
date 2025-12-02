# Yorru - Document Text Extraction Service
# Version: 0.0.2
# Supports: PDF (text + scanned), images (via Vision API)

from pypdf import PdfReader
import pdfplumber
from typing import Optional
import base64
import openai
from config import settings

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY


def extract_text_with_vision(image_path: str) -> Optional[str]:
    """
    Use GPT-4 Vision to extract text/content from an image.

    Works for:
    - Scanned PDFs (converted to images)
    - Photos of documents, menus, flyers
    - Diagrams, charts, schedules
    """
    try:
        # Read and encode the image
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        # Determine mime type
        ext = image_path.lower().split(".")[-1]
        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp"
        }
        mime_type = mime_map.get(ext, "image/jpeg")

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Extract ALL text and information from this document/image.
Include:
- All visible text (headers, body, labels, captions)
- Descriptions of any diagrams, charts, or images
- Table data in a readable format
- Any dates, times, prices, or important details

Format the output as clean, readable text that captures everything useful from this document."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4096
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Vision extraction failed: {e}")
        return None


def extract_text_from_pdf(pdf_path: str) -> Optional[str]:
    """
    Extract text from a PDF file.

    Strategy:
    1. Try pypdf text extraction
    2. If little/no text found, try pdfplumber
    3. If still minimal text (likely scanned), use Vision API
    """
    text_parts = []

    # Method 1: Try pypdf
    try:
        reader = PdfReader(pdf_path)
        for page_num, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(f"[Page {page_num}]\n{page_text}\n")
    except Exception as e:
        print(f"pypdf extraction failed: {e}")

    # Check if we got meaningful text
    total_text = "".join(text_parts)
    if len(total_text.strip()) > 100:
        return total_text

    # Method 2: Try pdfplumber (better for complex layouts)
    try:
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_parts.append(f"[Page {page_num}]\n{page_text}\n")

        total_text = "".join(text_parts)
        if len(total_text.strip()) > 100:
            return total_text
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")

    # Method 3: If minimal text, likely scanned - use Vision
    # Note: This works by converting PDF pages to images
    # For now, just use Vision on the file directly if supported
    print("PDF has minimal text, attempting Vision extraction...")
    vision_text = extract_text_with_vision(pdf_path)
    if vision_text:
        return f"[Extracted via Vision AI]\n{vision_text}"

    # Return whatever we got, even if minimal
    return total_text if total_text.strip() else None


def extract_text_from_image(image_path: str) -> Optional[str]:
    """Extract text/content from an image using Vision API."""
    return extract_text_with_vision(image_path)


def extract_text_from_file(file_path: str, file_type: str) -> Optional[str]:
    """
    Extract text from various file types.

    Supported:
    - PDF (text-based and scanned)
    - TXT (plain text)
    - Images (JPG, PNG, GIF, WEBP) - via Vision API
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

    elif file_type in ["jpg", "jpeg", "png", "gif", "webp"]:
        return extract_text_from_image(file_path)

    else:
        print(f"Unsupported file type: {file_type}")
        return None
