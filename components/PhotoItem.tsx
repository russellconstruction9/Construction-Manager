
import React from 'react';
import { CameraIcon, AlertTriangleIcon } from './icons/Icons';

interface PhotoItemProps {
    projectId: number | string;
    photo: { id: number | string; description: string; imageDataUrl?: string; };
    className?: string;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ projectId, photo, className }) => {
    const imageUrl = photo.imageDataUrl;
    const [hasError, setHasError] = React.useState(false);
    
    if (!imageUrl || hasError) {
        return (
             <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-500 text-xs text-center p-2 border border-gray-200 ${className}`}>
                <AlertTriangleIcon className="w-8 h-8 text-gray-400 mb-1" />
                <p>Image not available</p>
            </div>
        );
    }

    return (
        <img 
            src={imageUrl} 
            alt={photo.description} 
            className={className}
            onError={() => setHasError(true)} 
        />
    );
}

export default PhotoItem;
