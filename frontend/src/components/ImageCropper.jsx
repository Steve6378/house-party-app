import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

/**
 * ImageCropper component for cropping and zooming images
 * Supports custom aspect ratios and produces cropped blob output
 */
function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1, // 1 = square, 16/9 = widescreen, etc.
  aspectRatioOptions = null, // Array of {label, value} for selectable ratios
  title = 'Crop Image',
  cropShape = 'rect' // 'rect' or 'round'
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = () => {
        // Set canvas size to cropped area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Handle rotation
        if (rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        // Draw cropped image
        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          0.9
        );
      };
      img.src = image;
    });
  };

  const handleConfirm = async () => {
    const croppedBlob = await createCroppedImage();
    if (croppedBlob) {
      // Create a File from the blob
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      onCropComplete(file, croppedBlob);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800/80 border-b border-primary-500/20">
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition p-2"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          Apply
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={selectedAspectRatio}
          cropShape={cropShape}
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
        />
      </div>

      {/* Controls */}
      <div className="bg-dark-800/80 border-t border-primary-500/20 px-4 py-4 space-y-4">
        {/* Aspect Ratio Options */}
        {aspectRatioOptions && (
          <div className="flex items-center justify-center gap-2">
            {aspectRatioOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedAspectRatio(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedAspectRatio === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Zoom Control */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setZoom(Math.max(1, zoom - 0.1))}
            className="p-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32 md:w-48 accent-primary-500"
          />
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="p-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            className="p-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition ml-4"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm">
          Drag to reposition, scroll to zoom
        </p>
      </div>
    </div>
  );
}

export default ImageCropper;
