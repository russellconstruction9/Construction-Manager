import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto } from '../types';

const getNextId = <T extends { id: number }>(arr: T[]) =>
  arr.length === 0 ? 1 : Math.max(...arr.map(i => i.id)) + 1;

interface DataContextType {
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (data: { name: string; role: string; hourlyRate: number }) => void;
  addProject: (data: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => void;
  addTask: (data: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => void;
  toggleClockInOut: (projectId?: number) => void;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrl: string, description: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Auto-select user if none selected
  useEffect(() => {
    if (users.length && !currentUser) setCurrentUser(prev => prev ?? users[0]);
    if (!users.length && currentUser) setCurrentUser(null);
  }, [users]);

  const addUser = ({ name, role, hourlyRate }: { name: string; role: string; hourlyRate: number }) => {
    const newUser: User = {
      id: getNextId(users),
      name,
      role,
      hourlyRate,
      avatarUrl: '/default-avatar.svg',
      isClockedIn: false,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const addProject = (data: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => {
    const newProject: Project = {
      ...data,
      id: getNextId(projects),
      currentSpend: 0,
      punchList: [],
      photos: [],
    };
    setProjects(prev => [...prev, newProject]);
  };

  const addTask = (data: Omit<Task, 'id' | 'status'>) =>
    setTasks(prev => [...prev, { ...data, id: getNextId(tasks), status: TaskStatus.ToDo }]);

  // FIX: Added missing function definitions to resolve 'Cannot find name' errors.
  const updateTaskStatus = (taskId: number, status: TaskStatus) => {
    setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, status } : task)));
  };

  const toggleClockInOut = (projectId?: number) => {
    if (!currentUser) return;

    const getCurrentLocation = (): Promise<Location | undefined> => {
      // Mock implementation doesn't use real geolocation
      return Promise.resolve(undefined);
    };

    if (currentUser.isClockedIn) {
      getCurrentLocation().then(location => {
        const clockInTime = currentUser.clockInTime;
        if (!clockInTime) return;
        const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
        if (existingLogIndex === -1) return;

        const now = new Date();
        const durationMs = now.getTime() - clockInTime.getTime();
        const hoursWorked = durationMs / (1000 * 60 * 60);
        const cost = hoursWorked * currentUser.hourlyRate;

        const updatedLog: TimeLog = { ...timeLogs[existingLogIndex], clockOut: now, durationMs, cost, clockOutLocation: location };
        const newTimeLogs = [...timeLogs];
        newTimeLogs[existingLogIndex] = updatedLog;

        setTimeLogs(newTimeLogs.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));

        const updatedUser = { ...currentUser, isClockedIn: false, clockInTime: undefined, currentProjectId: undefined };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));

        const clockedOutProjectId = timeLogs[existingLogIndex].projectId;
        setProjects(prev => prev.map(p => (p.id === clockedOutProjectId ? { ...p, currentSpend: p.currentSpend + cost } : p)));
      });
    } else {
      if (!projectId) return;
      getCurrentLocation().then(location => {
        const clockInTime = new Date();
        const updatedUser = { ...currentUser, isClockedIn: true, clockInTime, currentProjectId: projectId };

        const newLog: TimeLog = { id: getNextId(timeLogs), userId: currentUser.id, projectId: projectId, clockIn: clockInTime, clockInLocation: location };
        setTimeLogs(prev => [newLog, ...prev]);

        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
      });
    }
  };

  const addPunchListItem = (projectId: number, text: string) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              punchList: [...p.punchList, { id: getNextId(p.punchList), text, isComplete: false }],
            }
          : p
      )
    );
  };

  const togglePunchListItem = (projectId: number, itemId: number) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              punchList: p.punchList.map(item => (item.id === itemId ? { ...item, isComplete: !item.isComplete } : item)),
            }
          : p
      )
    );
  };

  const addPhoto = (projectId: number, imageDataUrl: string, description: string) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              photos: [{ id: getNextId(p.photos), imageDataUrl, description, dateAdded: new Date() }, ...p.photos],
            }
          : p
      )
    );
  };

  // FIX: Replaced JSX with React.createElement to prevent TSX parsing errors in a .ts file.
  const value = {
    users,
    projects,
    tasks,
    timeLogs,
    currentUser,
    setCurrentUser,
    addUser,
    addProject,
    addTask,
    updateTaskStatus,
    toggleClockInOut,
    addPunchListItem,
    togglePunchListItem,
    addPhoto,
  };
  
  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
