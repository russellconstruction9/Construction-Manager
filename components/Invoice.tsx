
import React, { useEffect } from 'react';
import { Project, TimeLog } from '../types';
import { format } from 'date-fns';
import { R2LogoIcon } from './icons/Icons';

interface InvoiceProps {
    project: Project;
    timeLogs: TimeLog[];
    summary: string;
    onRendered: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ project, timeLogs, summary, onRendered }) => {
    
    useEffect(() => {
        // Simple callback after the component mounts.
        // A more complex component with images would need to wait for them to load.
        requestAnimationFrame(() => {
            onRendered();
        });
    }, [onRendered]);

    const totalLaborCost = timeLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
    const totalHours = timeLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);
    const materialsAndOtherCost = project.currentSpend - totalLaborCost;

    const today = new Date();
    const invoiceNumber = `INV-${project.id}-${format(today, 'yyyyMMdd')}`;

    return (
        <div className="bg-white text-gray-800 font-sans p-10" style={{ width: '210mm' }}>
            {/* Header */}
            <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
                <div className="flex items-center gap-4">
                    <R2LogoIcon className="w-16 h-16 text-primary-navy" />
                    <div>
                        <h1 className="text-2xl font-bold text-primary-navy">R² Technologies</h1>
                        <p className="text-sm text-gray-500">123 Construction Ave, Builder City, 12345</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-bold text-gray-400 uppercase">Invoice</h2>
                    <p className="text-sm mt-2">
                        <span className="font-semibold">Invoice #:</span> {invoiceNumber}
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold">Date:</span> {format(today, 'MMMM d, yyyy')}
                    </p>
                </div>
            </header>

            {/* Bill To Section */}
            <section className="mt-8 mb-10">
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Bill To</h3>
                <p className="font-bold text-lg">{project.name}</p>
                <p className="text-gray-600">{project.address}</p>
            </section>

            {/* Line Items Table */}
            <section>
                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-gray-600">
                        <tr>
                            <th className="p-3 font-semibold">Description</th>
                            <th className="p-3 font-semibold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">
                                <p className="font-medium">Total Labor Costs</p>
                                <p className="text-sm text-gray-500">{totalHours.toFixed(2)} hours logged</p>
                            </td>
                            <td className="p-3 text-right font-mono">${totalLaborCost.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b">
                            <td className="p-3">
                                <p className="font-medium">Materials & Other Project Costs</p>
                            </td>
                            <td className="p-3 text-right font-mono">${materialsAndOtherCost.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Totals Section */}
            <section className="flex justify-end mt-6">
                <div className="w-full max-w-xs">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                            <span>Total Due</span>
                            <span className="font-mono">${project.currentSpend.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notes Section */}
            <section className="mt-10 pt-6 border-t-2 border-gray-200">
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Notes</h3>
                <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: summary }}></div>
            </section>
        </div>
    );
}

export default Invoice;
