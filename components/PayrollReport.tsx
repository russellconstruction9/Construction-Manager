import React, { useEffect } from 'react';
import { User, TimeLog, Project } from '../types';
import { format } from 'date-fns';
import { SccLogoIcon } from './icons/Icons';

interface PayrollReportProps {
    user: User;
    logs: TimeLog[];
    projects: Project[];
    weekStart: Date;
    weekEnd: Date;
    totalHours: number;
    totalPay: number;
    onRendered: () => void;
}

const PayrollReport: React.FC<PayrollReportProps> = ({ user, logs, projects, weekStart, weekEnd, totalHours, totalPay, onRendered }) => {
    
    useEffect(() => {
        // A simple timeout to ensure rendering is complete. For this data-heavy table,
        // it's a straightforward way to wait for the DOM to be ready.
        const timer = setTimeout(() => {
            onRendered();
        }, 50); // A minimal delay
        return () => clearTimeout(timer);
    }, [onRendered]);

    const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || 'N/A';
    
    const msToHours = (ms?: number) => {
        if (!ms) return '0.00';
        return (ms / (1000 * 60 * 60)).toFixed(2);
    }

    return (
        <div className="bg-white text-gray-800 font-sans p-8" style={{ width: '210mm' }}>
            <header className="flex justify-between items-center border-b-4 border-primary-navy pb-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-primary-navy">Weekly Hours Report</h1>
                    <p className="text-lg text-gray-600">For Payroll Processing</p>
                </div>
                 <div className="text-right">
                    <SccLogoIcon className="w-16 h-16 text-primary-navy" />
                    <p className="font-bold text-primary-navy mt-1">Stoney Creek Construction</p>
                </div>
            </header>

            <section className="mb-8 grid grid-cols-3 gap-6 text-center">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Employee</h3>
                    <p className="text-lg font-semibold text-primary-navy">{user.name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Pay Period</h3>
                    <p className="text-lg font-semibold text-primary-navy">
                        {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
                    </p>
                </div>
                 <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-green-800">Total Pay</h3>
                    <p className="text-2xl font-bold text-green-700">${totalPay.toFixed(2)}</p>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Time Log Details</h2>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-gray-600">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Project</th>
                            <th className="p-2">Clock In</th>
                            <th className="p-2">Clock Out</th>
                            <th className="p-2 text-right">Duration (Hrs)</th>
                            <th className="p-2 text-right">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.sort((a,b) => a.clockIn.getTime() - b.clockIn.getTime()).map(log => (
                            <tr key={log.id} className="border-b">
                                <td className="p-2 font-medium">{format(log.clockIn, 'E, MMM d')}</td>
                                <td className="p-2">{getProjectName(log.projectId)}</td>
                                <td className="p-2">{format(log.clockIn, 'p')}</td>
                                <td className="p-2">{log.clockOut ? format(log.clockOut, 'p') : 'N/A'}</td>
                                <td className="p-2 text-right font-mono">{msToHours(log.durationMs)}</td>
                                <td className="p-2 text-right font-mono font-semibold">${log.cost?.toFixed(2) || '0.00'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold bg-slate-100">
                        <tr>
                            <td colSpan={4} className="p-2 text-right">Weekly Totals:</td>
                            <td className="p-2 text-right font-mono text-base">{totalHours.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono text-base">${totalPay.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>
        </div>
    );
}

export default PayrollReport;
