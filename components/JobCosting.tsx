
import React, { useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import { BarChartIcon, DollarSignIcon, ClockIcon } from './icons/Icons';

interface JobCostingProps {
    projectId: number;
}

const JobCosting: React.FC<JobCostingProps> = ({ projectId }) => {
    const { estimates, timeLogs, expenses } = useData();

    const stats = useMemo(() => {
        // 1. Calculate Budget (from Approved Estimates)
        const approvedEstimates = estimates.filter(e => e.projectId === projectId && e.status === 'Approved');
        
        let estLaborCost = 0;
        let estMaterialCost = 0;
        let estOtherCost = 0;
        let estHours = 0;

        approvedEstimates.forEach(est => {
            estHours += est.totalEstimatedHours;
            est.items.forEach(item => {
                if (item.type === 'Labor') estLaborCost += item.totalCost;
                else if (item.type === 'Material') estMaterialCost += item.totalCost;
                else estOtherCost += item.totalCost;
            });
        });

        const totalBudget = estLaborCost + estMaterialCost + estOtherCost;

        // 2. Calculate Actuals
        // Labor Actuals (from TimeLogs)
        const projectLogs = timeLogs.filter(log => log.projectId === projectId && log.clockOut);
        const actualLaborCost = projectLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
        const actualHours = projectLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);

        // Expense Actuals
        const projectExpenses = expenses.filter(e => e.projectId === projectId);
        let actualMaterialCost = 0;
        let actualOtherCost = 0;

        projectExpenses.forEach(exp => {
            if (exp.category === 'Material') actualMaterialCost += exp.amount;
            else actualOtherCost += exp.amount;
        });

        const totalActual = actualLaborCost + actualMaterialCost + actualOtherCost;

        return {
            estLaborCost, estMaterialCost, estOtherCost, estHours, totalBudget,
            actualLaborCost, actualMaterialCost, actualOtherCost, actualHours, totalActual
        };
    }, [estimates, timeLogs, expenses, projectId]);

    const getProgressColor = (actual: number, estimated: number) => {
        if (estimated === 0) return 'bg-gray-200';
        const ratio = actual / estimated;
        if (ratio > 1) return 'bg-red-500';
        if (ratio > 0.85) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const getDiff = (actual: number, estimated: number) => {
        const diff = estimated - actual;
        return diff >= 0 ? `$${diff.toFixed(2)} Remaining` : `-$${Math.abs(diff).toFixed(2)} Over`;
    };

    if (estimates.filter(e => e.projectId === projectId && e.status === 'Approved').length === 0) {
        return (
             <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                <BarChartIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <h3 className="text-lg font-bold text-gray-700">No Job Costing Data</h3>
                <p className="text-gray-500">Approve an estimate to see job costing analysis.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Job Costing Analysis</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800 uppercase flex items-center gap-2">
                        <DollarSignIcon className="w-4 h-4"/> Total Budget
                    </h3>
                    <p className="text-2xl font-bold text-blue-900 mt-2">${stats.totalBudget.toFixed(2)}</p>
                    <p className="text-xs text-blue-600 mt-1">Based on Approved Estimates</p>
                </Card>
                <Card className={stats.totalActual > stats.totalBudget ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}>
                     <h3 className={`text-sm font-bold uppercase flex items-center gap-2 ${stats.totalActual > stats.totalBudget ? "text-red-800" : "text-green-800"}`}>
                        <DollarSignIcon className="w-4 h-4"/> Actual Cost
                    </h3>
                    <p className={`text-2xl font-bold mt-2 ${stats.totalActual > stats.totalBudget ? "text-red-900" : "text-green-900"}`}>${stats.totalActual.toFixed(2)}</p>
                    <p className={`text-xs mt-1 ${stats.totalActual > stats.totalBudget ? "text-red-600" : "text-green-600"}`}>
                        {getDiff(stats.totalActual, stats.totalBudget)}
                    </p>
                </Card>
                 <Card>
                    <h3 className="text-sm font-bold text-gray-600 uppercase flex items-center gap-2">
                        <ClockIcon className="w-4 h-4"/> Labor Hours
                    </h3>
                    <div className="flex justify-between items-end mt-2">
                        <div>
                             <p className="text-2xl font-bold text-gray-900">{stats.actualHours.toFixed(1)}</p>
                             <p className="text-xs text-gray-500">Actual Hours</p>
                        </div>
                         <div className="text-right">
                             <p className="text-lg font-semibold text-gray-600">/ {stats.estHours.toFixed(1)}</p>
                             <p className="text-xs text-gray-500">Budgeted</p>
                        </div>
                    </div>
                     <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div 
                            className={`h-2 rounded-full ${getProgressColor(stats.actualHours, stats.estHours)}`} 
                            style={{ width: `${Math.min((stats.actualHours / (stats.estHours || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                </Card>
            </div>

            <Card>
                <h3 className="font-bold text-gray-800 mb-4">Cost Breakdown</h3>
                <div className="space-y-6">
                    {/* Labor */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">Labor</span>
                            <span className="text-gray-500">${stats.actualLaborCost.toFixed(2)} / ${stats.estLaborCost.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                             <div 
                                className={`h-3 rounded-full ${getProgressColor(stats.actualLaborCost, stats.estLaborCost)}`} 
                                style={{ width: `${Math.min((stats.actualLaborCost / (stats.estLaborCost || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Material */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">Materials</span>
                            <span className="text-gray-500">${stats.actualMaterialCost.toFixed(2)} / ${stats.estMaterialCost.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                             <div 
                                className={`h-3 rounded-full ${getProgressColor(stats.actualMaterialCost, stats.estMaterialCost)}`} 
                                style={{ width: `${Math.min((stats.actualMaterialCost / (stats.estMaterialCost || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Other */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">Subcontractor / Equipment / Other</span>
                            <span className="text-gray-500">${stats.actualOtherCost.toFixed(2)} / ${stats.estOtherCost.toFixed(2)}</span>
                        </div>
                         <div className="w-full bg-gray-100 rounded-full h-3">
                             <div 
                                className={`h-3 rounded-full ${getProgressColor(stats.actualOtherCost, stats.estOtherCost)}`} 
                                style={{ width: `${Math.min((stats.actualOtherCost / (stats.estOtherCost || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default JobCosting;
