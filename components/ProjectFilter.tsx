import React from 'react';
import { Project } from '../types';

interface ProjectFilterProps {
  projects: Project[];
  selectedProjectIds: number[];
  setSelectedProjectIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ projects, selectedProjectIds, setSelectedProjectIds }) => {
    
    const handleToggle = (projectId: number) => {
        setSelectedProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const selectAll = () => setSelectedProjectIds(projects.map(p => p.id));
    const deselectAll = () => setSelectedProjectIds([]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Projects</h3>
            <div className="flex justify-between mb-3">
                <button onClick={selectAll} className="text-xs font-semibold text-blue-600 hover:underline">Select All</button>
                <button onClick={deselectAll} className="text-xs font-semibold text-blue-600 hover:underline">Deselect All</button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {projects.map(project => (
                    <label key={project.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(project.id)}
                            onChange={() => handleToggle(project.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{project.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default ProjectFilter;
