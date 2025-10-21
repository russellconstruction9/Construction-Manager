import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { CameraIcon } from './icons/Icons';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

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
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const dataUrl = await fileToDataUrl(file);
            setImagePreview(dataUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !description) {
            alert('Please select an image and add a description.');
            return;
        }
        
        const imageDataUrl = await fileToDataUrl(imageFile);
        await addPhoto(projectId, imageDataUrl, description);
        
        // Reset state and close
        setDescription('');
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Photo to Log">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Photo</label>
                    <div 
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={triggerFileInput}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-60 rounded-md object-contain" />
                        ) : (
                            <div className="space-y-1 text-center">
                                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <p className="pl-1">Take a photo or upload a file</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Daily Log</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 'Completed foundation pour for the east wing.'"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={!imageFile || !description}>Add to Project</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPhotoModal;
