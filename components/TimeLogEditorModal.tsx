import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { TimeLog } from '../types';
import { format, parse } from 'date-fns';

interface TimeLogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: TimeLog | null;
  userId: number;
}

const TimeLogEditorModal: React.FC<TimeLogEditorModalProps> = ({ isOpen, onClose, log, userId }) => {
    const { projects, users, addManualTimeLog, updateTimeLog } = useData();
    const isEditMode = log !== null;
    
    const [projectId, setProjectId] = useState<number | ''>('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && log) {
                setProjectId(log.projectId);
                setDate(format(log.clockIn, 'yyyy-MM-dd'));
                setStartTime(format(log.clockIn, 'HH:mm'));
                setEndTime(log.clockOut ? format(log.clockOut, 'HH:mm') : '');
                setNotes(log.notes || '');
            } else {
                setProjectId('');
                setDate(format(new Date(), 'yyyy-MM-dd'));
                setStartTime('');
                setEndTime('');
                setNotes('');
            }
            setError('');
        }
    }, [isOpen, isEditMode, log]);
    
    const { duration, cost, clockIn, clockOut } = useMemo(() => {
        if (!date || !startTime || !endTime) return { duration: '0h 0m', cost: '$0.00' };

        try {
            const clockInDate = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
            const clockOutDate = parse(`${date} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

            if (clockInDate >= clockOutDate) {
                return { duration: 'Invalid times', cost: '$0.00', clockIn: clockInDate, clockOut: clockOutDate };
            }

            const durationMs = clockOutDate.getTime() - clockInDate.getTime();
            const hours = durationMs / 3600000;
            
            const user = users.find(u => u.id === userId);
            const calculatedCost = user ? hours * user.hourlyRate : 0;
            
            const durationH = Math.floor(hours);
            const durationM = Math.round((hours - durationH) * 60);

            return {
                duration: `${durationH}h ${durationM}m`,
                cost: `$${calculatedCost.toFixed(2)}`,
                clockIn: clockInDate,
                clockOut: clockOutDate
            };
        } catch(e) {
            return { duration: 'Invalid date', cost: '$0.00' };
        }
    }, [date, startTime, endTime, userId, users]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!projectId || !date || !startTime || !endTime) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!clockIn || !clockOut || clockIn >= clockOut) {
            setError('Clock out time must be after clock in time.');
            return;
        }

        const logData = {
            projectId: Number(projectId),
            clockIn,
            clockOut,
            notes
        };

        if (isEditMode && log) {
            updateTimeLog(log.id, logData);
        } else {
            addManualTimeLog({ ...logData, userId });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Time Log" : "Add Manual Time Entry"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <select value={projectId} onChange={e => setProjectId(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300" required>
                        <option value="" disabled>Select a project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Clock In Time</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Clock Out Time</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-slate-300" placeholder="e.g., Worked late to finish framing."></textarea>
                </div>

                <div className="pt-4 border-t border-slate-200 text-sm">
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Calculated Duration:</span>
                        <span className="font-bold text-gray-800">{duration}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="font-medium text-gray-600">Calculated Cost:</span>
                        <span className="font-bold text-gray-800">{cost}</span>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Log</Button>
                </div>
            </form>
        </Modal>
    );
};

export default TimeLogEditorModal;