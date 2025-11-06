import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPunchListPhoto } from '../utils/db';
import { PunchListItem } from '../types';
import Button from './Button';

interface PhotoAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (annotatedDataUrl: string) => void;
  item: PunchListItem;
}

const PhotoAnnotationModal: React.FC<PhotoAnnotationModalProps> = ({ isOpen, onClose, onSave, item }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF0000'); // Default red
  const [lineWidth, setLineWidth] = useState(5);
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef(-1);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear future history
    if (historyIndex.current < history.current.length - 1) {
      history.current.splice(historyIndex.current + 1);
    }
    
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndex.current = history.current.length - 1;
  }, []);
  
  const loadBaseImage = useCallback(() => {
    if (!item.photo) return;
    getPunchListPhoto(item.photo.baseImageId).then(imageDataUrl => {
        if (imageDataUrl) {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = imageDataUrl;
            image.onload = () => {
                const aspectRatio = image.width / image.height;
                const maxWidth = window.innerWidth * 0.9;
                const maxHeight = window.innerHeight * 0.7;

                let newWidth = maxWidth;
                let newHeight = newWidth / aspectRatio;

                if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = newHeight * aspectRatio;
                }

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(image, 0, 0, newWidth, newHeight);

                // Save initial state for undo
                history.current = [];
                historyIndex.current = -1;
                saveState();
            };
        }
    });
  }, [item.photo, saveState]);

  useEffect(() => {
    if (isOpen) {
        loadBaseImage();
    }
  }, [isOpen, loadBaseImage]);
  
  const handleUndo = () => {
    if (historyIndex.current <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    historyIndex.current -= 1;
    const imageData = history.current[historyIndex.current];
    ctx.putImageData(imageData, 0, 0);
  };
  
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = (e as React.TouchEvent).touches?.[0];

    return {
      x: (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left,
      y: (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
    saveState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
      {/* Controls */}
      <div className="w-full max-w-4xl bg-gray-800 text-white p-2 rounded-t-lg flex flex-wrap justify-center items-center gap-4">
        <div className="flex items-center gap-2">
            <label className="text-sm">Color:</label>
            {['#FF0000', '#0000FF', '#FFFF00'].map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}></button>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <label className="text-sm">Size:</label>
            {[3, 5, 10].map(w => (
                <button key={w} onClick={() => setLineWidth(w)} className={`w-8 h-8 rounded-full flex items-center justify-center ${lineWidth === w ? 'bg-white/30' : 'bg-white/10'}`}>
                    <span className="bg-white rounded-full" style={{ width: `${w + 2}px`, height: `${w + 2}px`}}></span>
                </button>
            ))}
        </div>
        <button onClick={handleUndo} className="px-3 py-1 bg-white/10 rounded-md text-sm hover:bg-white/20">Undo</button>
        <button onClick={loadBaseImage} className="px-3 py-1 bg-white/10 rounded-md text-sm hover:bg-white/20">Clear</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="bg-white cursor-crosshair touch-none"
      />
      
      {/* Actions */}
      <div className="w-full max-w-4xl bg-gray-800 p-2 rounded-b-lg flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Save Annotation</Button>
      </div>
    </div>
  );
};

export default PhotoAnnotationModal;