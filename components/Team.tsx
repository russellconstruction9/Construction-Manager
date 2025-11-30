
import React, { useState } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import { formatDistanceToNowStrict } from 'date-fns';
import Button from './Button';
import { PlusIcon, PencilIcon } from './icons/Icons';
import AddTeamMemberModal from './AddTeamMemberModal';
import EditTeamMemberModal from './EditTeamMemberModal';
import EmptyState from './EmptyState';
import { User } from '../types';

const Team: React.FC = () => {
    const { users, currentUser } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const isAdmin = currentUser?.roleType === 'Admin';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Team Members</h1>
                {isAdmin && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                        New Member
                    </Button>
                )}
            </div>

            {users.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {users.map(user => (
                        <Card key={user.id} className="text-center relative group">
                             {isAdmin && (
                                <button 
                                    onClick={() => setEditingUser(user)}
                                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Edit Member & Permissions"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            )}
                            
                            <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full mx-auto" />
                            <h2 className="mt-4 text-lg font-bold text-gray-800">{user.name}</h2>
                            <p className="text-sm text-gray-500">{user.role}</p>
                            
                            <div className="mt-2 mb-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    user.roleType === 'Admin' 
                                        ? 'bg-purple-100 text-purple-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {user.roleType || 'Employee'}
                                </span>
                            </div>

                            {isAdmin && (
                                <p className="text-sm font-semibold text-gray-700 mb-3">${user.hourlyRate.toFixed(2)}/hr</p>
                            )}
                            
                            <div className="mt-auto pt-3 border-t border-slate-100">
                                {user.isClockedIn ? (
                                    <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                        <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                                        Clocked In
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                        <span className="w-2 h-2 mr-2 bg-gray-500 rounded-full"></span>
                                        Clocked Out
                                    </div>
                                )}
                            </div>
                            {user.isClockedIn && user.clockInTime && (
                                <p className="text-xs text-gray-500 mt-2">
                                    for {formatDistanceToNowStrict(user.clockInTime)}
                                </p>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    title="No Team Members Yet"
                    message="Get started by adding your first team member."
                    buttonText="New Member"
                    onButtonClick={() => setIsAddModalOpen(true)}
                />
            )}
            
            <AddTeamMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditTeamMemberModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} />
        </div>
    );
};

export default Team;
