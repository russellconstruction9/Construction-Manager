import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import { Project } from '../types';
import Button from './Button';
import { PlusIcon } from './icons/Icons';
import AddProjectModal from './AddProjectModal';
import EmptyState from './EmptyState';
import { format } from 'date-fns';

const ProjectCard: React.FC<{ project: Project }> = React.memo(({ project }) => {
    const { currentUser, toggleClockInOut } = useData();

    const handleClockIn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        toggleClockInOut(project.id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress': return 'text-blue-600 bg-blue-100';
            case 'Completed': return 'text-green-600 bg-green-100';
            case 'On Hold': return 'text-amber-600 bg-amber-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    
    return (
        <Link to={`/projects/${project.id}`} className="block h-full">
            <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{project.address}</p>
                    <p className="text-sm font-medium text-gray-600 mt-2">{project.type}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                           {format(project.startDate, 'MMM d, yyyy')} - {format(project.endDate, 'MMM d, yyyy')}
                       </p>
                       
                       {currentUser && !currentUser.isClockedIn && project.status === 'In Progress' && (
                           <Button onClick={handleClockIn} className="px-3 py-1 text-xs font-semibold">
                               Clock In
                           </Button>
                       )}
                       {currentUser && currentUser.isClockedIn && currentUser.currentProjectId === project.id && (
                          <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              <span className="relative flex h-2 w-2 mr-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              Active
                          </div>
                       )}
                    </div>
                </div>
            </Card>
        </Link>
    );
});


const Projects: React.FC = () => {
    const { projects } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Projects</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Project
                </Button>
            </div>

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No Projects Yet"
                    message="Get started by creating your first project."
                    buttonText="New Project"
                    onButtonClick={() => setIsModalOpen(true)}
                />
            )}

            <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default Projects;