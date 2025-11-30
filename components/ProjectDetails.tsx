
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { format } from 'date-fns';
import { ChevronLeftIcon, CameraIcon, FileTextIcon, DollarSignIcon, Building2Icon, ClipboardCheckIcon, ListChecksIcon, PlusIcon } from './icons/Icons';
import PhotoItem from './PhotoItem';
import { getPhotosForProject } from '../utils/db';
import { generatePdfReport } from '../utils/reportGenerator';
import { generateInvoice } from '../utils/invoiceGenerator';
import Estimates from './Estimates';
import JobCosting from './JobCosting';
import Expenses from './Expenses';

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, tasks, users, timeLogs, currentUser } = useData();
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Estimates' | 'Job Costing' | 'Expenses'>('Overview');
    
    const project = projects.find(p => p.id === Number(projectId));
    const isAdmin = currentUser?.roleType === 'Admin';
    
    // Hooks must be called unconditionally
    const projectTasks = useMemo(() => {
        if (!project) return [];
        return tasks.filter(task => task.projectId === project.id);
    }, [tasks, project]);
    
    const taskProgress = useMemo(() => {
        if (!project || projectTasks.length === 0) return 0;
        const completedTasks = projectTasks.filter(task => task.status === 'Done').length;
        return Math.round((completedTasks / projectTasks.length) * 100);
    }, [projectTasks, project]);
    
    const budgetUsedPercentage = useMemo(() => {
        if (!project || project.budget <= 0) return 0;
        return Math.round((project.currentSpend / project.budget) * 100);
    }, [project]);

    // Conditional return must happen AFTER all hooks
    if (!project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Project not found</h1>
                <p className="mt-2 text-gray-600">The project you are looking for does not exist.</p>
                <Link to="/projects" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all projects
                </Link>
            </div>
        );
    }
    
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const projectTimeLogs = timeLogs.filter(log => log.projectId === project.id);
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            const projectPhotos = await getPhotosForProject(project.id, project.photos);

            await generatePdfReport({
                project,
                tasks: projectTasks,
                timeLogs: projectTimeLogs,
                photos: projectPhotos,
                users,
            });

        } catch (error) {
            console.error("Failed to generate report:", error);
            alert("Sorry, there was an error generating the report. Please check the console for details.");
        } finally {
            setIsGeneratingReport(false);
        }
    };
    
    const handleGenerateInvoice = async () => {
        setIsGeneratingInvoice(true);
        try {
            const projectTimeLogs = timeLogs.filter(log => log.projectId === project.id);
            await generateInvoice({
                project,
                timeLogs: projectTimeLogs,
            });
        } catch (error) {
            console.error("Failed to generate invoice:", error);
            alert("Sorry, there was an error generating the invoice. Please check the console for details.");
        } finally {
            setIsGeneratingInvoice(false);
        }
    };

    const tabs = [
        { name: 'Overview', icon: Building2Icon },
        { name: 'Estimates', icon: ClipboardCheckIcon },
        { name: 'Job Costing', icon: DollarSignIcon },
        { name: 'Expenses', icon: ListChecksIcon },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <Link to="/projects" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />
                    Back to Projects
                </Link>
                <div className="flex flex-col sm:flex-row gap-2">
                    {isAdmin && activeTab === 'Overview' && (
                        <Button onClick={handleGenerateInvoice} disabled={isGeneratingInvoice || isGeneratingReport}>
                            <DollarSignIcon className="w-5 h-5 mr-2 -ml-1" />
                            {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                        </Button>
                    )}
                    {activeTab === 'Overview' && (
                        <Button onClick={handleGenerateReport} disabled={isGeneratingReport || isGeneratingInvoice} variant="secondary">
                            <FileTextIcon className="w-5 h-5 mr-2 -ml-1" />
                            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
                        <p className="text-gray-500 mt-1">{project.address}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-left md:text-right">
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{project.type}</span>
                        <p className="text-sm text-gray-500 mt-2">{format(project.startDate, 'MMM d, yyyy')} - {format(project.endDate, 'MMM d, yyyy')}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Task Progress</span>
                        <span className="text-sm font-medium text-gray-700">{taskProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${taskProgress}%` }}></div>
                    </div>
                </div>
                
                {/* Navigation Tabs */}
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mt-8 overflow-x-auto">
                    {tabs.map((tab) => {
                        // Hide Job Costing/Expenses/Estimates for Employees if desired, currently showing for all but can restrict.
                        // For simplicity, strict RBAC is mainly on Actions, but view can be open.
                        if (!isAdmin && (tab.name === 'Job Costing' || tab.name === 'Estimates' || tab.name === 'Expenses')) return null;

                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name as any)}
                                className={`flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                    activeTab === tab.name
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                <span className="whitespace-nowrap">{tab.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <Link to={`/projects/${project.id}/tasks`}>
                            <h2 className="text-xl font-bold mb-4 hover:text-blue-600">Tasks ({projectTasks.length})</h2>
                        </Link>
                        {projectTasks.length > 0 ? (
                            <ul className="space-y-4">
                                {projectTasks.slice(0, 3).map(task => {
                                    const assignee = users.find(u => u.id === task.assigneeId);
                                    return (
                                        <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{task.title}</p>
                                                <p className="text-sm text-gray-500">Due: {format(task.dueDate, 'MMM d')}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${task.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{task.status}</span>
                                                {assignee && <img src={assignee.avatarUrl} alt={assignee.name} title={assignee.name} className="w-8 h-8 rounded-full" />}
                                            </div>
                                        </li>
                                    );
                                })}
                                {projectTasks.length > 3 && (
                                    <p className="text-sm text-gray-500 pt-2 text-center">... and {projectTasks.length - 3} more</p>
                                )}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No tasks assigned to this project yet.</p>
                        )}
                        <Link to={`/projects/${project.id}/tasks`} className="mt-4 w-full block text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            View All / Add Task
                        </Link>
                    </Card>

                    <div className="space-y-6">
                        {isAdmin && (
                            <Card>
                                <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm font-medium text-gray-600">
                                            <span>Current Spend</span>
                                            <span>Budget</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-semibold text-gray-800">
                                            <span>${project.currentSpend.toFixed(2)}</span>
                                            <span>${project.budget.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                            <div 
                                                className={`${budgetUsedPercentage > 100 ? 'bg-red-500' : 'bg-green-500'} h-2.5 rounded-full`} 
                                                style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                        <Card>
                            <Link to={`/punch-lists/${project.id}`} className="block">
                                <h2 className="text-xl font-bold mb-4 hover:text-blue-600">Punch List ({project.punchList.length})</h2>
                            </Link>
                            {project.punchList.length > 0 ? (
                                <ul className="space-y-2">
                                    {project.punchList.slice(0, 3).map(item => (
                                        <li key={item.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={item.isComplete}
                                                readOnly
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className={`ml-2 text-sm ${item.isComplete ? 'text-gray-500 line-through' : ''}`}>
                                                {item.text}
                                            </span>
                                        </li>
                                    ))}
                                    {project.punchList.length > 3 && <p className="text-sm text-gray-500 mt-2">+ {project.punchList.length - 3} more</p>}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No punch list items yet.</p>
                            )}
                        </Card>

                        <Card>
                            <Link to={`/projects/${project.id}/photos`} className="block">
                                <h2 className="text-xl font-bold mb-4 hover:text-blue-600">Project Photos ({project.photos.length})</h2>
                            </Link>
                            {project.photos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {project.photos.slice(0, 4).map(photo => (
                                        <PhotoItem key={photo.id} projectId={project.id} photo={photo} className="aspect-square w-full rounded-md object-cover" />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    <CameraIcon className="w-12 h-12 mx-auto text-gray-300" />
                                    <p className="mt-2 text-sm">No photos added yet.</p>
                                </div>
                            )}
                            <Link to={`/projects/${project.id}/photos`} className="mt-4 w-full block text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                View All / Add Photo
                            </Link>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'Estimates' && isAdmin && (
                <Estimates projectId={project.id} />
            )}

            {activeTab === 'Job Costing' && isAdmin && (
                <JobCosting projectId={project.id} />
            )}

            {activeTab === 'Expenses' && isAdmin && (
                <Expenses projectId={project.id} />
            )}
        </div>
    );
};

export default ProjectDetails;
