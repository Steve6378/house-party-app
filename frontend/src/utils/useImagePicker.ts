/**
 * Hook for picking images from camera or gallery
 * Uses native APIs on mobile, file input on web
 */

import { useState, useCallback, useRef } from 'react';
import { isNative, takePicture, pickPhoto } from './native';

interface UseImagePickerOptions {
  onImageSelected?: (imageUrl: string) => void;
}

export function useImagePicker(options: UseImagePickerOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file selection from input (web)
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        options.onImageSelected?.(imageUrl);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  }, [options]);

  // Pick from camera (native) or trigger file input (web)
  const openCamera = useCallback(async () => {
    if (isNative) {
      setIsLoading(true);
      try {
        const imageUrl = await takePicture();
        if (imageUrl) {
          options.onImageSelected?.(imageUrl);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // On web, just open file picker with capture attribute
      fileInputRef.current?.click();
    }
  }, [options]);

  // Pick from gallery
  const openGallery = useCallback(async () => {
    if (isNative) {
      setIsLoading(true);
      try {
        const imageUrl = await pickPhoto();
        if (imageUrl) {
          options.onImageSelected?.(imageUrl);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // On web, just open file picker
      fileInputRef.current?.click();
    }
  }, [options]);

  // Show options dialog (camera or gallery) on mobile
  const pickImage = useCallback(async () => {
    if (isNative) {
      // On mobile, default to gallery since it gives both options
      await openGallery();
    } else {
      // On web, open file picker
      fileInputRef.current?.click();
    }
  }, [openGallery]);

  // Create the file input element props
  const fileInputProps = {
    ref: fileInputRef,
    type: 'file' as const,
    accept: 'image/*',
    onChange: handleFileSelect,
    className: 'hidden',
  };

  return {
    pickImage,
    openCamera,
    openGallery,
    isLoading,
    isNative,
    fileInputProps,
    fileInputRef,
  };
}

export default useImagePicker;
