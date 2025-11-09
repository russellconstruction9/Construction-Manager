import React, { useMemo } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import { TaskStatus } from '../types';
import { isThisWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import ProjectListItem from './ProjectListItem'; // Import the new detailed component

const Dashboard: React.FC = () => {
    try {
        const { projects, tasks, users, currentUser, timeLogs } = useData();

        if (!currentUser && users.length === 0) {
            return (
                <div className="text-center py-10">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome to ConstructTrack Pro</h1>
                    <p className="mt-2 text-gray-600">Get started by adding your first team member.</p>
                </div>
            );
        }

        // Time tracking data
        const userTimeLogsThisWeek = useMemo(() => timeLogs.filter(log => 
            log.userId === currentUser?.id && 
            log.clockOut && 
            isThisWeek(new Date(log.clockIn), { weekStartsOn: 1 })
        ), [timeLogs, currentUser]);

        const totalMsThisWeek = useMemo(() => userTimeLogsThisWeek.reduce((acc, log) => acc + (log.durationMs || 0), 0), [userTimeLogsThisWeek]);
        
        const hoursThisWeek = useMemo(() => (totalMsThisWeek / (1000 * 60 * 60)).toFixed(1), [totalMsThisWeek]);

        const weeklyCost = useMemo(() => userTimeLogsThisWeek.reduce((acc, log) => acc + (log.cost || 0), 0), [userTimeLogsThisWeek]);
        
        // Task status counts
        const { todoTasks, inProgressTasks, doneTasks } = useMemo(() => ({
            todoTasks: tasks.filter(t => t.status === TaskStatus.ToDo).length,
            inProgressTasks: tasks.filter(t => t.status === TaskStatus.InProgress).length,
            doneTasks: tasks.filter(t => t.status === TaskStatus.Done).length,
        }), [tasks]);

        // Team status
        const teamClockedIn = useMemo(() => users.filter(u => u.isClockedIn).length, [users]);
        
        const projectsInProgress = useMemo(() => projects.filter(p => p.status === 'In Progress'), [projects]);

        return (
            <div className="space-y-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}!` : "Dashboard"}
                </h1>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                            <div className="text-sm text-gray-600">Total Projects</div>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{projectsInProgress.length}</div>
                            <div className="text-sm text-gray-600">Active Projects</div>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{teamClockedIn}</div>
                            <div className="text-sm text-gray-600">Team Clocked In</div>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{hoursThisWeek}h</div>
                            <div className="text-sm text-gray-600">Hours This Week</div>
                        </div>
                    </Card>
                </div>

                {/* Task Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Task Overview</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">To Do</span>
                                <span className="text-lg font-semibold text-gray-800">{todoTasks}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">In Progress</span>
                                <span className="text-lg font-semibold text-orange-600">{inProgressTasks}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Completed</span>
                                <span className="text-lg font-semibold text-green-600">{doneTasks}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4">This Week</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Hours Worked</span>
                                <span className="text-lg font-semibold text-blue-600">{hoursThisWeek}h</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Cost</span>
                                <span className="text-lg font-semibold text-green-600">${weeklyCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Sessions</span>
                                <span className="text-lg font-semibold text-purple-600">{userTimeLogsThisWeek.length}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4">Team Status</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Members</span>
                                <span className="text-lg font-semibold text-gray-800">{users.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Currently Working</span>
                                <span className="text-lg font-semibold text-green-600">{teamClockedIn}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Available</span>
                                <span className="text-lg font-semibold text-gray-600">{users.length - teamClockedIn}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Projects Overview ({projectsInProgress.length})</h2>
                    {projectsInProgress.length > 0 ? (
                        <div className="space-y-4">
                            {projectsInProgress.slice(0, 5).map(project => (
                               <ProjectListItem key={project.id} project={project} />
                            ))}
                        </div>
                    ) : <p className="text-gray-500">No projects are currently in progress.</p>}
                </Card>
            </div>
        );
    } catch (error) {
        console.error('Dashboard error:', error);
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Loading Dashboard...</h1>
                <p className="mt-2 text-gray-600">Please wait while we load your data.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Refresh Page
                </button>
            </div>
        );
    }
};

export default Dashboard;