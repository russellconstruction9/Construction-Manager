
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { EstimateItem, EstimateItemType } from '../types';
import { PlusIcon, Trash2Icon } from './icons/Icons';

interface AddEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

const AddEstimateModal: React.FC<AddEstimateModalProps> = ({ isOpen, onClose, projectId }) => {
    const { addEstimate } = useData();
    const [name, setName] = useState('');
    const [items, setItems] = useState<EstimateItem[]>([]);
    
    // New Item State
    const [description, setDescription] = useState('');
    const [type, setType] = useState<EstimateItemType>('Material');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('');

    const handleAddItem = () => {
        if (!description || !quantity || !unitCost) return;
        
        const qty = Number(quantity);
        const cost = Number(unitCost);
        const total = qty * cost;
        const hours = type === 'Labor' ? Number(estimatedHours) : 0;

        const newItem: EstimateItem = {
            id: Date.now(),
            description,
            type,
            quantity: qty,
            unit,
            unitCost: cost,
            totalCost: total,
            estimatedHours: hours
        };

        setItems([...items, newItem]);
        
        // Reset inputs
        setDescription('');
        setQuantity('');
        setUnit('');
        setUnitCost('');
        setEstimatedHours('');
        setType('Material');
    };

    const handleRemoveItem = (id: number) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || items.length === 0) {
            alert("Please provide an estimate name and at least one line item.");
            return;
        }

        const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
        const totalEstimatedHours = items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);

        addEstimate({
            projectId,
            name,
            dateCreated: new Date(),
            status: 'Draft',
            items,
            totalAmount,
            totalEstimatedHours
        });

        setName('');
        setItems([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Estimate">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Estimate Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Initial Bid, Kitchen Reno V2"
                        className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm border-b pb-2">Add Line Item</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                             <label className="text-xs text-gray-500">Description</label>
                             <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border-gray-300 bg-white text-gray-900 text-sm" placeholder="Item description" />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Type</label>
                             <select value={type} onChange={e => setType(e.target.value as EstimateItemType)} className="w-full rounded-md border-gray-300 bg-white text-gray-900 text-sm">
                                 <option value="Labor">Labor</option>
                                 <option value="Material">Material</option>
                                 <option value="Subcontractor">Subcontractor</option>
                                 <option value="Equipment">Equipment</option>
                                 <option value="Other">Other</option>
                             </select>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Quantity</label>
                             <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-md border-gray-300 bg-white text-gray-900 text-sm" placeholder="0" />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Unit (e.g., hrs, sqft)</label>
                             <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full rounded-md border-gray-300 bg-white text-gray-900 text-sm" placeholder="ea" />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Unit Cost ($)</label>
                             <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full rounded-md border-gray-300 bg-white text-gray-900 text-sm" placeholder="0.00" />
                        </div>
                         {type === 'Labor' && (
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-500">Est. Hours (for Time Tracking)</label>
                                <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} className="w-full rounded-md border-gray-300 bg-white text-gray-900 text-sm" placeholder="Total hours expected" />
                            </div>
                        )}
                    </div>
                    <Button onClick={handleAddItem} variant="secondary" className="w-full mt-2" disabled={!description || !quantity || !unitCost}>
                        <PlusIcon className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                </div>

                <div className="max-h-60 overflow-y-auto">
                    {items.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                            <div className="font-medium">{item.description}</div>
                                            <div className="text-xs text-gray-500">{item.quantity} {item.unit} @ ${item.unitCost}</div>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900 text-right font-bold">
                                            ${item.totalCost.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-4">No items added yet.</p>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                     <div>
                        <span className="text-sm font-medium text-gray-500">Total Estimate:</span>
                        <span className="ml-2 text-xl font-bold text-gray-900">${items.reduce((s, i) => s + i.totalCost, 0).toFixed(2)}</span>
                     </div>
                     <div className="flex gap-2">
                        <Button onClick={onClose} variant="secondary">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={items.length === 0 || !name}>Save Estimate</Button>
                     </div>
                </div>
            </div>
        </Modal>
    );
};

export default AddEstimateModal;
