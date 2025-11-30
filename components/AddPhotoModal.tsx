
import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { CameraIcon, AlertTriangleIcon } from './icons/Icons';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ isOpen, onClose, projectId }) => {
    const { addPhoto } = useData();
    const [description, setDescription] = useState('');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            
            // Validate file sizes
            const oversizedFiles = newFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
            if (oversizedFiles.length > 0) {
                setError(`Some files were skipped because they exceed the ${MAX_FILE_SIZE_MB}MB limit.`);
            }

            const validFiles = newFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
            
            try {
                const dataUrlPromises = validFiles.map(fileToDataUrl);
                const newDataUrls = await Promise.all(dataUrlPromises);
                setImagePreviews(prev => [...prev, ...newDataUrls]);
            } catch (err) {
                setError("Failed to process images. Please try again.");
                console.error(err);
            }
        }
        // Reset input to allow selecting the same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (imagePreviews.length === 0 || !description) {
            setError('Please select at least one image and add a description.');
            return;
        }
        
        setIsProcessing(true);
        try {
            await addPhoto(projectId, imagePreviews, description);
            
            // Reset state and close
            setDescription('');
            setImagePreviews([]);
            setIsProcessing(false);
            onClose();
        } catch (err: any) {
            console.error("Error in form submission:", err);
            setError(err.message || "An error occurred while saving. Please try again.");
            setIsProcessing(false);
        }
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleClose = () => {
        if (!isProcessing) {
            setError(null);
            onClose();
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Photo to Log">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start">
                        <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Photos ({imagePreviews.length})</label>
                     <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square">
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    aria-label={`Remove image ${index + 1}`}
                                    disabled={isProcessing}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button"
                            className="flex flex-col justify-center items-center p-2 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors aspect-square focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={triggerFileInput}
                            disabled={isProcessing}
                        >
                            <CameraIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <span className="mt-1 text-xs text-center text-gray-600">Add Photo</span>
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 5MB per file. Images are stored locally.</p>
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Daily Log</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 'Completed foundation pour for the east wing.'"
                        required
                        disabled={isProcessing}
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={isProcessing}>Cancel</Button>
                    <Button type="submit" disabled={imagePreviews.length === 0 || !description || isProcessing}>
                        {isProcessing ? 'Saving...' : 'Add to Project'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPhotoModal;