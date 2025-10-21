import React, { useState } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import Button from './Button';
import { PlusIcon, Trash2Icon, CopyIcon } from './icons/Icons';
import AddInventoryItemModal from './AddInventoryItemModal';
import EmptyState from './EmptyState';
import { InventoryItem } from '../types';
import InventoryItemCard from './InventoryItemCard';
import EditInventoryItemModal from './EditInventoryItemModal';

const Inventory: React.FC = () => {
    const { inventory, orderList, removeFromOrderList, clearOrderList, addManualItemToOrderList } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [copied, setCopied] = useState(false);
    const [manualItemName, setManualItemName] = useState('');

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualItemName.trim()) {
            addManualItemToOrderList(manualItemName.trim());
            setManualItemName('');
        }
    };

    const handleCopy = () => {
        const text = orderList.map(orderItem => {
            if (orderItem.type === 'inventory') {
                const item = inventory.find(i => i.id === orderItem.itemId);
                return item ? `- ${item.name} (Current: ${item.quantity} ${item.unit})` : '';
            }
            return `- ${orderItem.name} (Manual Add)`;
        }).filter(Boolean).join('\n');
        
        navigator.clipboard.writeText(`Inventory Order List:\n${text}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventory</h1>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Item
                </Button>
            </div>

            {orderList.length > 0 && (
                <Card>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                        <h2 className="text-xl font-bold">Order List ({orderList.length})</h2>
                        <div className="flex gap-2">
                            <Button onClick={handleCopy} variant="secondary" className="text-sm">
                                <CopyIcon className="w-4 h-4 mr-2"/> {copied ? 'Copied!' : 'Copy List'}
                            </Button>
                            <Button onClick={clearOrderList} variant="destructive" className="text-sm">Clear List</Button>
                        </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                        {orderList.map(orderItem => {
                            if (orderItem.type === 'inventory') {
                                const item = inventory.find(i => i.id === orderItem.itemId);
                                if (!item) return null;
                                return (
                                     <li key={`inv-${item.id}`} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-500">Current: {item.quantity} {item.unit} (Low at: {item.lowStockThreshold})</p>
                                        </div>
                                        <Button onClick={() => removeFromOrderList(orderItem)} variant="secondary" className="!p-2 !shadow-none bg-transparent hover:bg-red-50">
                                            <Trash2Icon className="w-4 h-4 text-red-600"/>
                                        </Button>
                                    </li>
                                );
                            } else {
                                return (
                                    <li key={`man-${orderItem.id}`} className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                                        <div>
                                            <p className="font-medium">{orderItem.name}</p>
                                            <p className="text-sm text-blue-700">Manually Added</p>
                                        </div>
                                        <Button onClick={() => removeFromOrderList(orderItem)} variant="secondary" className="!p-2 !shadow-none bg-transparent hover:bg-red-50">
                                            <Trash2Icon className="w-4 h-4 text-red-600"/>
                                        </Button>
                                    </li>
                                )
                            }
                        })}
                    </ul>
                     <form onSubmit={handleManualAdd} className="flex gap-2 pt-4 border-t border-slate-200">
                        <input
                            type="text"
                            value={manualItemName}
                            onChange={(e) => setManualItemName(e.target.value)}
                            placeholder="Add a one-off item..."
                            className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        <Button type="submit">
                            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                            Add
                        </Button>
                    </form>
                </Card>
            )}

            {inventory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.map(item => (
                        <InventoryItemCard key={item.id} item={item} onEdit={setEditingItem} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No Inventory Items"
                    message="Get started by adding your first inventory item."
                    buttonText="New Item"
                    onButtonClick={() => setIsAddModalOpen(true)}
                />
            )}

            <AddInventoryItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditInventoryItemModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} />
        </div>
    );
};

export default Inventory;