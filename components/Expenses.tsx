
import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { PlusIcon, Trash2Icon } from './icons/Icons';
import Modal from './Modal';
import { EstimateItemType } from '../types';
import { format } from 'date-fns';
import EmptyState from './EmptyState';

interface ExpensesProps {
    projectId: number;
}

const Expenses: React.FC<ExpensesProps> = ({ projectId }) => {
    const { expenses, addExpense, deleteExpense } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<EstimateItemType>('Material');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const projectExpenses = expenses.filter(e => e.projectId === projectId).sort((a,b) => b.date.getTime() - a.date.getTime());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) return;

        addExpense({
            projectId,
            description,
            amount: Number(amount),
            category,
            date: new Date(date)
        });

        setDescription('');
        setAmount('');
        setCategory('Material');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Actual Expenses</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    Log Expense
                </Button>
            </div>

            {projectExpenses.length > 0 ? (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {projectExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{format(exp.date, 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{exp.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold">${exp.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => deleteExpense(exp.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <EmptyState
                    title="No Expenses Logged"
                    message="Track materials, subcontractors, and other costs here."
                    buttonText="Log First Expense"
                    onButtonClick={() => setIsModalOpen(true)}
                />
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Project Expense">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g. Lumber from Home Depot" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0.00" required />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Category</label>
                         <select value={category} onChange={e => setCategory(e.target.value as EstimateItemType)} className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                             <option value="Material">Material</option>
                             <option value="Subcontractor">Subcontractor</option>
                             <option value="Equipment">Equipment</option>
                             <option value="Other">Other</option>
                         </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Expense</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;
