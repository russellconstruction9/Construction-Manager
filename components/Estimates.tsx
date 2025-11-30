
import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { PlusIcon, FileTextIcon, CheckIcon } from './icons/Icons';
import AddEstimateModal from './AddEstimateModal';
import EmptyState from './EmptyState';
import { format } from 'date-fns';

interface EstimatesProps {
    projectId: number;
}

const Estimates: React.FC<EstimatesProps> = ({ projectId }) => {
    const { estimates, updateEstimateStatus } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const projectEstimates = estimates.filter(e => e.projectId === projectId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Estimates</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Estimate
                </Button>
            </div>

            {projectEstimates.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {projectEstimates.map(est => (
                        <Card key={est.id}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <FileTextIcon className="w-5 h-5 text-gray-500" />
                                        {est.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Created on {format(est.dateCreated, 'MMM d, yyyy')}</p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        est.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        est.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                        {est.status}
                                    </span>
                                    {est.status === 'Draft' && (
                                        <div className="flex gap-2">
                                            <Button 
                                                onClick={() => updateEstimateStatus(est.id, 'Approved')} 
                                                className="bg-green-600 hover:bg-green-700 !py-1 !text-xs"
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                onClick={() => updateEstimateStatus(est.id, 'Rejected')} 
                                                variant="destructive"
                                                className="!py-1 !text-xs"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Unit Cost</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {est.items.map((item, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-900">{item.description}</td>
                                                <td className="px-4 py-2">{item.type}</td>
                                                <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                                                <td className="px-4 py-2 text-right">${item.unitCost.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right font-bold">${item.totalCost.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">Estimate Total:</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">${est.totalAmount.toFixed(2)}</td>
                                        </tr>
                                        {est.totalEstimatedHours > 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-1 text-right font-medium text-gray-600">Total Est. Labor Hours:</td>
                                                <td className="px-4 py-1 text-right font-medium text-gray-800">{est.totalEstimatedHours.toFixed(1)} hrs</td>
                                            </tr>
                                        )}
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No Estimates Created"
                    message="Create an estimate to start tracking budget and job costing."
                    buttonText="Create First Estimate"
                    onButtonClick={() => setIsModalOpen(true)}
                />
            )}

            <AddEstimateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} projectId={projectId} />
        </div>
    );
};

export default Estimates;
