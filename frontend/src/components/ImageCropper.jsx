import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check, MoveHorizontal } from 'lucide-react';

/**
 * ImageCropper component for cropping and zooming images
 *
 * Two modes:
 * - Profile (default): Fixed 1:1 aspect, round crop
 * - Banner (widthSlider=true): Adjustable width (2:1 to 4:1), zoom
 */
function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  title = 'Crop Image',
  cropShape = 'rect',
  widthSlider = false, // Enable width slider mode for banners
  minAspect = 2,       // Min width ratio (2:1)
  maxAspect = 4        // Max width ratio (4:1)
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentAspect, setCurrentAspect] = useState(widthSlider ? minAspect : aspectRatio);

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
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

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
          aspect={currentAspect}
          cropShape={cropShape}
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
        />
      </div>

      {/* Controls */}
      <div className="bg-dark-800/80 border-t border-primary-500/20 px-4 py-4 space-y-4">
        {/* Width Slider (for banners) */}
        {widthSlider && (
          <div className="flex items-center justify-center gap-4">
            <MoveHorizontal className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm w-12">Narrow</span>
            <input
              type="range"
              min={minAspect}
              max={maxAspect}
              step={0.1}
              value={currentAspect}
              onChange={(e) => setCurrentAspect(Number(e.target.value))}
              className="w-40 md:w-56 accent-primary-500"
            />
            <span className="text-gray-400 text-sm w-10">Wide</span>
            <span className="text-gray-500 text-xs ml-2">
              {currentAspect.toFixed(1)}:1
            </span>
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
        </div>

        <p className="text-center text-gray-500 text-sm">
          Drag to reposition, scroll to zoom
        </p>
      </div>
    </div>
  );
}

export default ImageCropper;
