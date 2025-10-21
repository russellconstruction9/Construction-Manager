import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { InventoryItem } from '../types';

interface EditInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const EditInventoryItemModal: React.FC<EditInventoryItemModalProps> = ({ isOpen, onClose, item }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const { updateInventoryItem } = useData();

  useEffect(() => {
    if (item) {
        setName(item.name);
        setUnit(item.unit);
        setLowStockThreshold(item.lowStockThreshold?.toString() || '');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !name || !unit) {
      alert('Please fill in all required fields.');
      return;
    }
    updateInventoryItem(item.id, { 
        name, 
        unit,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : undefined 
    });
    onClose();
  };
  
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Inventory Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            id="editItemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="editItemQuantity" className="block text-sm font-medium text-gray-700">Current Quantity</label>
          <input
            type="number"
            id="editItemQuantity"
            value={item.quantity}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 text-gray-500 sm:text-sm"
            disabled
          />
        </div>
        <div>
            <label htmlFor="editUnit" className="block text-sm font-medium text-gray-700">Unit</label>
             <input
                type="text"
                id="editUnit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
            />
        </div>
        <div>
            <label htmlFor="editLowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold (Optional)</label>
            <input
                type="number"
                id="editLowStockThreshold"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 10"
                min="0"
            />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditInventoryItemModal;
