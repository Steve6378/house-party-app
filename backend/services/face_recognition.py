# Yorru - Face Recognition Service
# Version: 0.0.2

"""
Face recognition service for finding photos containing specific people.
Uses OpenCV with deep learning models for face detection and recognition.

Features:
- Extract face encodings from images using OpenCV DNN
- Compare faces to find matches
- Store and retrieve face encodings efficiently
"""

import io
import json
import numpy as np
from typing import Optional, List, Tuple
from PIL import Image
import os

# Try to import OpenCV
FACE_RECOGNITION_AVAILABLE = False
cv2 = None
face_detector = None
face_recognizer = None

try:
    import cv2 as cv2_module
    cv2 = cv2_module

    # Check if we have the required models
    # Use OpenCV's built-in Haar Cascade for face detection (always available)
    haar_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    if os.path.exists(haar_cascade_path):
        face_detector = cv2.CascadeClassifier(haar_cascade_path)
        FACE_RECOGNITION_AVAILABLE = True
        print("OpenCV face detection initialized with Haar Cascade")
    else:
        print("Warning: Haar Cascade file not found. Face recognition disabled.")

except ImportError:
    print("Warning: OpenCV not installed. Face recognition features disabled.")
except Exception as e:
    print(f"Warning: Error initializing face detection: {e}")


def is_available() -> bool:
    """Check if face recognition is available."""
    return FACE_RECOGNITION_AVAILABLE


def _image_to_cv2(image_data: bytes) -> Optional[np.ndarray]:
    """Convert image bytes to OpenCV format."""
    try:
        # Convert bytes to PIL Image
        pil_image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if necessary
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')

        # Convert PIL to numpy array (RGB)
        rgb_array = np.array(pil_image)

        # Convert RGB to BGR for OpenCV
        bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)

        return bgr_array
    except Exception as e:
        print(f"Error converting image: {e}")
        return None


def _extract_face_features(face_roi: np.ndarray) -> List[float]:
    """
    Extract simple features from a face region.
    Uses histogram-based features as a lightweight face encoding.
    """
    try:
        # Resize face to standard size
        face_resized = cv2.resize(face_roi, (64, 64))

        # Convert to grayscale
        gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)

        # Apply histogram equalization for better feature extraction
        equalized = cv2.equalizeHist(gray)

        # Calculate histogram features (more detailed)
        hist = cv2.calcHist([equalized], [0], None, [64], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()

        # Add LBP-like texture features
        # Simple edge detection for additional features
        sobelx = cv2.Sobel(equalized, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(equalized, cv2.CV_64F, 0, 1, ksize=3)

        # Get histogram of gradients
        mag = np.sqrt(sobelx**2 + sobely**2)
        mag_hist = cv2.calcHist([mag.astype(np.float32)], [0], None, [32], [0, 256])
        mag_hist = cv2.normalize(mag_hist, mag_hist).flatten()

        # Combine features (64 + 32 = 96 features)
        features = np.concatenate([hist, mag_hist])

        return features.tolist()
    except Exception as e:
        print(f"Error extracting face features: {e}")
        return []


def get_face_encoding(image_data: bytes) -> Optional[List[float]]:
    """
    Extract face encoding from an image.

    Args:
        image_data: Raw bytes of the image

    Returns:
        List of floats representing the face encoding, or None if no face found
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return None

    try:
        # Convert to OpenCV format
        image = _image_to_cv2(image_data)
        if image is None:
            return None

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        if len(faces) == 0:
            return None

        # Get the largest face (most likely the main subject)
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        x, y, w, h = largest_face

        # Extract face region with some padding
        padding = int(0.1 * max(w, h))
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(image.shape[1], x + w + padding)
        y2 = min(image.shape[0], y + h + padding)

        face_roi = image[y1:y2, x1:x2]

        # Extract features
        return _extract_face_features(face_roi)

    except Exception as e:
        print(f"Error extracting face encoding: {e}")
        return None


def get_all_face_encodings(image_data: bytes) -> List[List[float]]:
    """
    Extract all face encodings from an image (for group photos).

    Args:
        image_data: Raw bytes of the image

    Returns:
        List of face encodings (each encoding is a list of floats)
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return []

    try:
        # Convert to OpenCV format
        image = _image_to_cv2(image_data)
        if image is None:
            return []

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        if len(faces) == 0:
            return []

        encodings = []
        for (x, y, w, h) in faces:
            # Extract face region with padding
            padding = int(0.1 * max(w, h))
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(image.shape[1], x + w + padding)
            y2 = min(image.shape[0], y + h + padding)

            face_roi = image[y1:y2, x1:x2]

            # Extract features
            features = _extract_face_features(face_roi)
            if features:
                encodings.append(features)

        return encodings

    except Exception as e:
        print(f"Error extracting face encodings: {e}")
        return []


def compare_faces(
    known_encoding: List[float],
    face_encodings: List[List[float]],
    tolerance: float = 0.6
) -> Tuple[bool, float]:
    """
    Compare a known face encoding against a list of encodings from a photo.

    Args:
        known_encoding: The face encoding to search for (e.g., from profile photo)
        face_encodings: List of face encodings from an event photo
        tolerance: How much distance between faces to consider a match (lower = stricter)

    Returns:
        Tuple of (is_match, best_distance) where:
        - is_match: True if any face matches the known encoding
        - best_distance: Distance to the closest match (lower = better match)
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return False, 1.0

    if not known_encoding or not face_encodings:
        return False, 1.0

    try:
        # Convert to numpy arrays
        known_np = np.array(known_encoding)

        best_distance = 1.0
        is_match = False

        for encoding in face_encodings:
            encoding_np = np.array(encoding)

            # Ensure same dimensions
            if known_np.shape != encoding_np.shape:
                continue

            # Calculate normalized distance (cosine similarity converted to distance)
            # Cosine similarity: higher is more similar
            dot_product = np.dot(known_np, encoding_np)
            norm_known = np.linalg.norm(known_np)
            norm_enc = np.linalg.norm(encoding_np)

            if norm_known > 0 and norm_enc > 0:
                cosine_sim = dot_product / (norm_known * norm_enc)
                # Convert to distance (0 = identical, 1 = completely different)
                distance = 1 - cosine_sim
            else:
                distance = 1.0

            if distance < best_distance:
                best_distance = distance

            if distance <= tolerance:
                is_match = True

        return is_match, float(best_distance)

    except Exception as e:
        print(f"Error comparing faces: {e}")
        return False, 1.0


def encoding_to_json(encoding: List[float]) -> str:
    """Convert face encoding to JSON string for database storage."""
    return json.dumps(encoding)


def encoding_from_json(json_str: str) -> Optional[List[float]]:
    """Convert JSON string back to face encoding."""
    try:
        return json.loads(json_str)
    except:
        return None


def find_photos_with_face(
    profile_encoding: List[float],
    photo_encodings: List[Tuple[str, List[List[float]]]],
    tolerance: float = 0.6
) -> List[Tuple[str, float]]:
    """
    Find photos containing a specific face.

    Args:
        profile_encoding: Face encoding from user's profile photo
        photo_encodings: List of (photo_id, [face_encodings]) tuples
        tolerance: Match tolerance (lower = stricter)

    Returns:
        List of (photo_id, confidence) tuples for matching photos,
        sorted by confidence (best matches first)
    """
    matches = []

    for photo_id, encodings in photo_encodings:
        is_match, distance = compare_faces(profile_encoding, encodings, tolerance)

        if is_match:
            # Convert distance to confidence (0-1, higher = better)
            confidence = max(0, 1 - distance)
            matches.append((photo_id, confidence))

    # Sort by confidence (best matches first)
    matches.sort(key=lambda x: x[1], reverse=True)

    return matches
