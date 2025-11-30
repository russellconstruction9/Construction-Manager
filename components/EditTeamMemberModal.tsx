
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { User, UserRole } from '../types';

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({ isOpen, onClose, user }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState(''); // Job Title
  const [roleType, setRoleType] = useState<UserRole>('Employee'); // Permissions
  const [hourlyRate, setHourlyRate] = useState('');
  const { updateUser } = useData();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setRoleType(user.roleType || 'Employee');
      setHourlyRate(user.hourlyRate.toString());
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !role || !hourlyRate) {
      alert('Please fill in all fields.');
      return;
    }
    updateUser(user.id, { 
        name, 
        role, 
        roleType, 
        hourlyRate: Number(hourlyRate) 
    });
    onClose();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="editName" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="editName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="editRole" className="block text-sm font-medium text-gray-700">Job Title / Role</label>
          <input
            type="text"
            id="editRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
            <label htmlFor="editRoleType" className="block text-sm font-medium text-gray-700">Permission Level</label>
            <select
                id="editRoleType"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as UserRole)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
                <option value="Employee">Employee (Limited Access)</option>
                <option value="Admin">Admin (Full Access)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Admins can create projects, see financials, and manage the team.</p>
        </div>
        <div>
            <label htmlFor="editHourlyRate" className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                    type="number"
                    id="editHourlyRate"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 bg-white text-gray-900 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    min="0"
                    step="0.01"
                    required
                />
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTeamMemberModal;
