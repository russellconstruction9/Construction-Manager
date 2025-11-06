import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { ChevronLeftIcon, PlusIcon, ImageIcon, Trash2Icon } from './icons/Icons';
import { PunchListItem } from '../types';
import PhotoAnnotationModal from './PhotoAnnotationModal';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const PunchListDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, addPunchListItem, togglePunchListItem, addPunchListPhoto, updatePunchListAnnotation, deletePunchListPhoto } = useData();
    const [newItemText, setNewItemText] = useState('');
    const [annotatingItem, setAnnotatingItem] = useState<PunchListItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentItemIdForUpload, setCurrentItemIdForUpload] = useState<number | null>(null);
    const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);
    const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
    const navigate = useNavigate();

    const project = projects.find(p => p.id === Number(projectId));

    if (!project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Project not found</h1>
                <Link to="/punch-lists" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all punch lists
                </Link>
            </div>
        );
    }
    
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            addPunchListItem(project.id, newItemText.trim());
            setNewItemText('');
        }
    };

    const handleAddPhotoClick = (itemId: number) => {
        setCurrentItemIdForUpload(itemId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const itemId = currentItemIdForUpload;
        
        if (file && itemId) {
            setUploadingPhotoId(itemId);
            try {
                const dataUrl = await fileToDataUrl(file);
                await addPunchListPhoto(project.id, itemId, dataUrl);
            } catch (error) {
                console.error("Error adding photo:", error);
                if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                    alert("Could not save photo. Your device storage is full. Please free up some space and try again.");
                } else {
                    alert("Could not add the photo. Please try again.");
                }
            } finally {
                setUploadingPhotoId(null);
            }
        }
        // Reset for next use
        if (fileInputRef.current) fileInputRef.current.value = '';
        setCurrentItemIdForUpload(null);
    };

    const handleSaveAnnotation = (annotatedDataUrl: string) => {
        if (annotatingItem) {
            updatePunchListAnnotation(project.id, annotatingItem.id, annotatedDataUrl);
        }
        setAnnotatingItem(null);
    };

    const handleDeletePhoto = async (e: React.MouseEvent, itemId: number) => {
        e.stopPropagation(); // Prevent opening annotation modal
        if (window.confirm("Are you sure you want to delete this photo?")) {
            setDeletingPhotoId(itemId);
            try {
                await deletePunchListPhoto(project.id, itemId);
            } catch (error) {
                console.error("Error deleting photo:", error);
                alert("Could not delete the photo. Please try again.");
            } finally {
                setDeletingPhotoId(null);
            }
        }
    }

    const completedItems = project.punchList.filter(item => item.isComplete).length;
    const totalItems = project.punchList.length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="space-y-6">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Punch List</h1>
                    <p className="text-gray-500 mt-1">For project: {project.name}</p>
                </div>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-700">
                        {completedItems} / {totalItems} items completed
                    </span>
                    <span className="text-lg font-medium text-gray-700">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </Card>

            <Card>
                <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new punch list item..."
                        className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <Button type="submit">
                        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                        Add Item
                    </Button>
                </form>

                {totalItems > 0 ? (
                    <ul className="space-y-3">
                        {project.punchList.map(item => (
                            <li key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
                                <label className="flex items-center space-x-4 cursor-pointer flex-grow">
                                    <input
                                        type="checkbox"
                                        checked={item.isComplete}
                                        onChange={() => togglePunchListItem(project.id, item.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <span className={`text-base ${item.isComplete ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                        {item.text}
                                    </span>
                                </label>
                                <div className="flex-shrink-0 self-center">
                                    {item.photo ? (
                                        <div className="relative group">
                                            <img
                                                src={item.photo.annotatedImageUrl}
                                                alt="Annotated punch list item"
                                                className="w-24 h-24 object-cover rounded-md border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                                                onClick={() => setAnnotatingItem(item)}
                                            />
                                            <button 
                                                onClick={(e) => handleDeletePhoto(e, item.id)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Delete photo"
                                                disabled={deletingPhotoId !== null}
                                            >
                                                {deletingPhotoId === item.id ? (
                                                     <span className="animate-spin h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
                                                ) : (
                                                    <Trash2Icon className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => handleAddPhotoClick(item.id)}
                                            disabled={uploadingPhotoId !== null}
                                        >
                                            {uploadingPhotoId === item.id ? (
                                                <>
                                                    <span className="animate-spin h-5 w-5 border-2 border-b-transparent border-slate-500 rounded-full inline-block mr-2 -ml-1"></span>
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon className="w-5 h-5 mr-2 -ml-1" />
                                                    Add Photo
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">This punch list is empty. Add an item to get started.</p>
                )}
            </Card>

            {annotatingItem && (
                <PhotoAnnotationModal
                    isOpen={!!annotatingItem}
                    onClose={() => setAnnotatingItem(null)}
                    onSave={handleSaveAnnotation}
                    item={annotatingItem}
                />
            )}
        </div>
    );
};

export default PunchListDetails;