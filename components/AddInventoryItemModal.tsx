
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const { addInventoryItem } = useData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !unit) {
      alert('Please fill in all fields.');
      return;
    }
    addInventoryItem({ 
      name, 
      quantity: Number(quantity), 
      unit,
      lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : undefined
    });
    setName('');
    setQuantity('');
    setUnit('');
    setLowStockThreshold('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Inventory Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            id="itemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., 2x4 Lumber"
            required
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Initial Quantity</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., 100"
            min="0"
            required
          />
        </div>
        <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
             <input
                type="text"
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., pieces, bags, ft"
                required
            />
        </div>
        <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold (Optional)</label>
            <input
                type="number"
                id="lowStockThreshold"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 10"
                min="0"
            />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Item</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInventoryItemModal;
