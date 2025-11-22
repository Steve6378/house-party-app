# Yorru - Input Sanitization Service
# Version: 0.0.1

"""
Input sanitization to prevent XSS and injection attacks.

Uses Bleach library to strip HTML tags from user input.
"""

import bleach


def sanitize_text(text: str, allow_basic_formatting: bool = False) -> str:
    """
    Sanitize user input by removing HTML tags.

    Args:
        text: Raw user input
        allow_basic_formatting: If True, allows <b>, <i>, <u> tags

    Returns:
        Sanitized text safe for storage and display
    """
    if not text:
        return text

    if allow_basic_formatting:
        # Allow basic text formatting
        allowed_tags = ['b', 'i', 'u', 'em', 'strong']
        allowed_attributes = {}  # No attributes allowed
        return bleach.clean(
            text,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
    else:
        # Strip ALL HTML tags
        return bleach.clean(text, tags=[], strip=True)


def sanitize_event_name(name: str) -> str:
    """Sanitize event name (no HTML allowed)"""
    return sanitize_text(name, allow_basic_formatting=False)


def sanitize_event_address(address: str) -> str:
    """Sanitize event address (no HTML allowed)"""
    return sanitize_text(address, allow_basic_formatting=False)


def sanitize_message_content(content: str, allow_formatting: bool = True) -> str:
    """
    Sanitize message content.

    By default allows basic formatting (bold, italic, underline).
    Set allow_formatting=False to strip all HTML.
    """
    return sanitize_text(content, allow_basic_formatting=allow_formatting)


def sanitize_user_name(name: str) -> str:
    """Sanitize user name (no HTML allowed)"""
    return sanitize_text(name, allow_basic_formatting=False)


def sanitize_ground_truth_value(value: str) -> str:
    """Sanitize ground truth fact value (no HTML allowed)"""
    return sanitize_text(value, allow_basic_formatting=False)
