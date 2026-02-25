import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw } from 'lucide-react';
import Button from './Button';

interface CropperModalProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

export default function CropperModal({ image, onCropComplete, onClose }: CropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col">
      <header className="p-6 flex items-center justify-between bg-black/80 backdrop-blur-lg border-b border-white/10">
        <button onClick={onClose} className="p-2 rounded-full bg-white/5">
          <X size={20} />
        </button>
        <h2 className="font-serif font-bold text-xl">Ajustar Enquadramento</h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 relative bg-zinc-900">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <footer className="p-8 bg-black/80 backdrop-blur-lg border-t border-white/10">
        <div className="flex flex-col gap-6 max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <RotateCcw size={16} className="text-white/40" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-gold-500"
            />
            <span className="text-xs font-bold text-white/40 w-8">{(zoom * 100).toFixed(0)}%</span>
          </div>
          
          <Button onClick={handleDone} icon={Check} className="w-full py-4">
            Confirmar Recorte
          </Button>
          
          <p className="text-center text-[10px] text-white/30 uppercase tracking-widest">
            Centralize seu rosto para melhores resultados.
          </p>
        </div>
      </footer>
    </div>
  );
}
