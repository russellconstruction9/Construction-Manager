
import React, { useState, useEffect } from 'react';
import { getPhoto } from '../utils/db';
import { CameraIcon, AlertTriangleIcon } from './icons/Icons';

interface PhotoItemProps {
    projectId: number;
    photo: { id: number; description: string; };
    className?: string;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ projectId, photo, className }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setHasError(false);
        setIsLoading(true);

        getPhoto(projectId, photo.id).then(url => {
            if (isMounted) {
                if (url) {
                    setImageUrl(url);
                } else {
                    // ID exists in project metadata but not in DB
                    setHasError(true);
                }
                setIsLoading(false);
            }
        }).catch((err) => {
            console.error("Error loading photo component:", err);
            if (isMounted) {
                setHasError(true);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [projectId, photo.id]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-200 animate-pulse ${className}`}>
                 <CameraIcon className="w-12 h-12 text-gray-400" />
            </div>
        );
    }
    
    if (hasError || !imageUrl) {
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
