import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, ProjectType } from '../types';

// --- INITIAL MOCK DATA ---
const INITIAL_USERS: User[] = [
  { id: 1, name: 'Ryan Russell', role: 'Project Manager', avatarUrl: 'https://i.pravatar.cc/150?u=ryan', isClockedIn: false, hourlyRate: 85 },
  { id: 2, name: 'John Williams', role: 'Lead Carpenter', avatarUrl: 'https://i.pravatar.cc/150?u=jw', isClockedIn: false, hourlyRate: 55 },
  { id: 3, name: 'Chris Paulson', role: 'Electrician', avatarUrl: 'https://i.pravatar.cc/150?u=cp', isClockedIn: false, hourlyRate: 62 },
  { id: 4, name: 'James Harden', role: 'Plumber', avatarUrl: 'https://i.pravatar.cc/150?u=jh', isClockedIn: false, hourlyRate: 58 },
];

const INITIAL_PROJECTS: Project[] = [
  { 
    id: 1, 
    name: 'Tyler Mitchell', 
    address: '785 E 660 S, Wolcottville, IN 46795', 
    type: ProjectType.Renovation, 
    status: 'In Progress', 
    startDate: new Date('2025-10-20T12:00:00Z'), 
    endDate: new Date('2026-02-15T00:00:00Z'), 
    budget: 350000, 
    currentSpend: 12500,
    punchList: [],
    photos: []
  },
  { 
    id: 2, 
    name: 'Joe Eicher', 
    address: '6430 S 125 E, Wolcottville, IN 46795', 
    type: ProjectType.NewConstruction, 
    status: 'In Progress', 
    startDate: new Date('2025-09-15T00:00:00Z'), 
    endDate: new Date('2026-01-30T00:00:00Z'), 
    budget: 485000, 
    currentSpend: 210000,
    punchList: [
        { id: 1, text: 'Verify HVAC rough-in complete', isComplete: true },
        { id: 2, text: 'Order long-lead time windows', isComplete: false },
    ],
    photos: [
       { id: 1, description: 'Spray foam insulation in upstairs walls.', dateAdded: new Date('2025-10-19T16:00:00Z')},
       { id: 2, description: 'Completed exterior sheathing.', dateAdded: new Date('2025-10-18T12:00:00Z')},
       { id: 3, description: 'Framing of the main floor.', dateAdded: new Date('2025-10-17T15:30:00Z')},
       { id: 4, description: 'Initial site work and foundation forms.', dateAdded: new Date('2025-10-15T10:00:00Z')},
    ]
  },
  {
    id: 3,
    name: 'Dennis Zmyslo',
    address: '260 Spring Beach Rd, Rome City, IN 46784',
    type: ProjectType.NewConstruction,
    status: 'In Progress',
    startDate: new Date('2025-08-01T00:00:00Z'),
    endDate: new Date('2025-12-20T00:00:00Z'),
    budget: 620000,
    currentSpend: 450000,
    punchList: [],
    photos: [
      { id: 1, description: 'Roofing felt is on.', dateAdded: new Date('2025-10-19T18:00:00Z')},
      { id: 2, description: 'Garage framing and sheathing.', dateAdded: new Date('2025-10-18T11:00:00Z')},
      { id: 3, description: 'View from the lake.', dateAdded: new Date('2025-10-17T14:00:00Z')},
      { id: 4, description: 'Trusses set for the main roof.', dateAdded: new Date('2025-10-16T09:00:00Z')},
    ]
  },
  {
    id: 4,
    name: 'Mike Mosier',
    address: '471 County Rd 17, Ashley, IN 46705',
    type: ProjectType.InteriorFitOut,
    status: 'Completed',
    startDate: new Date('2025-07-01T00:00:00Z'),
    endDate: new Date('2025-10-08T00:00:00Z'),
    budget: 150000,
    currentSpend: 145000,
    punchList: [],
    photos: [
      { id: 1, description: 'Final touches on the flooring.', dateAdded: new Date('2025-10-08T15:07:00Z')},
      { id: 2, description: 'Kitchen cabinets and island installed.', dateAdded: new Date('2025-10-05T11:00:00Z')},
      { id: 3, description: 'Fresh paint in the living room.', dateAdded: new Date('2025-10-02T13:00:00Z')},
      { id: 4, description: 'Initial state before remodel.', dateAdded: new Date('2025-09-28T16:00:00Z')},
    ]
  }
];

const INITIAL_TASKS: Task[] = [
    // Project 1 (Tyler Mitchell)
    { id: 1, title: 'Client design review', description: 'Finalize all design choices with Tyler Mitchell.', projectId: 1, assigneeId: 1, dueDate: new Date('2025-10-28T00:00:00Z'), status: TaskStatus.ToDo },
    { id: 2, title: 'Submit for permits', description: 'Submit all architectural plans to the county permit office.', projectId: 1, assigneeId: 1, dueDate: new Date('2025-11-05T00:00:00Z'), status: TaskStatus.ToDo },
    // Project 2 (Joe Eicher)
    { id: 3, title: 'Install HVAC ductwork', description: 'Run all main and secondary ducts before drywall.', projectId: 2, assigneeId: 4, dueDate: new Date('2025-10-25T00:00:00Z'), status: TaskStatus.InProgress },
    { id: 4, title: 'Frame interior walls', description: 'Build all non-load-bearing walls as per blueprint.', projectId: 2, assigneeId: 2, dueDate: new Date('2025-10-22T00:00:00Z'), status: TaskStatus.Done },
    { id: 5, title: 'Run electrical wiring', description: 'Rough-in all electrical boxes and wiring.', projectId: 2, assigneeId: 3, dueDate: new Date('2025-10-29T00:00:00Z'), status: TaskStatus.ToDo },
    // Project 3 (Dennis Zmyslo)
    { id: 6, title: 'Install windows and exterior doors', description: 'Ensure all units are plumb, level, and sealed.', projectId: 3, assigneeId: 2, dueDate: new Date('2025-10-24T00:00:00Z'), status: TaskStatus.InProgress },
    { id: 7, title: 'Install roofing shingles', description: 'Complete shingle installation on all roof surfaces.', projectId: 3, assigneeId: 2, dueDate: new Date('2025-10-31T00:00:00Z'), status: TaskStatus.ToDo },
    { id: 8, title: 'Pour foundation', description: 'Foundation pour for main structure and garage.', projectId: 3, assigneeId: 2, dueDate: new Date('2025-08-20T00:00:00Z'), status: TaskStatus.Done },
    // Project 4 (Mike Mosier)
    { id: 9, title: 'Final walkthrough with client', description: 'Create final punch list with Mike Mosier.', projectId: 4, assigneeId: 1, dueDate: new Date('2025-10-07T00:00:00Z'), status: TaskStatus.Done },
];

const INITIAL_TIME_LOGS: TimeLog[] = [
    // Logs for Project 2 (Joe Eicher)
    { id: 1, userId: 2, projectId: 2, clockIn: new Date('2025-10-20T08:00:00Z'), clockOut: new Date('2025-10-20T16:00:00Z'), durationMs: 28800000, cost: 440 },
    { id: 2, userId: 3, projectId: 2, clockIn: new Date('2025-10-20T09:00:00Z'), clockOut: new Date('2025-10-20T17:00:00Z'), durationMs: 28800000, cost: 496 },
    // Logs for Project 3 (Dennis Zmyslo)
    { id: 3, userId: 2, projectId: 3, clockIn: new Date('2025-10-19T08:00:00Z'), clockOut: new Date('2025-10-19T16:30:00Z'), durationMs: 30600000, cost: 467.5 },
    { id: 4, userId: 3, projectId: 3, clockIn: new Date('2025-10-19T08:30:00Z'), clockOut: new Date('2025-10-19T17:00:00Z'), durationMs: 30600000, cost: 527 },
    { id: 5, userId: 1, projectId: 3, clockIn: new Date('2025-10-19T10:00:00Z'), clockOut: new Date('2025-10-19T14:00:00Z'), durationMs: 14400000, cost: 340 },
    // Logs for Project 4 (Mike Mosier)
    { id: 6, userId: 2, projectId: 4, clockIn: new Date('2025-10-08T08:00:00Z'), clockOut: new Date('2025-10-08T12:00:00Z'), durationMs: 14400000, cost: 220 },
];

const INITIAL_INVENTORY = [
    { id: 1, name: '2x4 Lumber (8ft)', quantity: 150, unit: 'pieces', lowStockThreshold: 50 },
    { id: 2, name: 'Drywall Sheets (4x8)', quantity: 80, unit: 'sheets', lowStockThreshold: 20 },
    { id: 3, name: '5-gallon Paint (White)', quantity: 5, unit: 'buckets', lowStockThreshold: 2 },
];

// --- DATA PROVIDER LOGIC ---

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

const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

const getStoredItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item, reviver) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredItem('scc_users', INITIAL_USERS));
  const [projects, setProjects] = useState<Project[]>(() => getStoredItem('scc_projects', INITIAL_PROJECTS));
  const [tasks, setTasks] = useState<Task[]>(() => getStoredItem('scc_tasks', INITIAL_TASKS));
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => getStoredItem('scc_timeLogs', INITIAL_TIME_LOGS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredItem('scc_currentUser', null));

  // Persist state to localStorage on changes
  useEffect(() => { localStorage.setItem('scc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('scc_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('scc_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('scc_timeLogs', JSON.stringify(timeLogs)); }, [timeLogs]);
  useEffect(() => { localStorage.setItem('scc_currentUser', JSON.stringify(currentUser)); }, [currentUser]);

  // Auto-select user if none selected
  useEffect(() => {
    if (users.length && !currentUser) {
        const storedUser = getStoredItem<User | null>('scc_currentUser', null);
        // Find Ryan Russell specifically to be the default user
        const defaultUser = users.find(u => u.name === 'Ryan Russell') || users[0];
        const userExists = storedUser ? users.some(u => u.id === storedUser.id) : false;
        setCurrentUser(userExists ? storedUser : defaultUser);
    }
    if (!users.length && currentUser) setCurrentUser(null);
  }, [users, currentUser]);

  const addUser = ({ name, role, hourlyRate }: { name: string; role: string; hourlyRate: number }) => {
    const newUser: User = {
      id: getNextId(users),
      name,
      role,
      hourlyRate,
      avatarUrl: `https://i.pravatar.cc/150?u=${name.split(' ')[0]}`,
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