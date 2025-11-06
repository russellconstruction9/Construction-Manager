import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, ProjectType, Invoice, InvoiceStatus } from '../types';
// FIX: Renamed imported function to avoid conflict with the one defined in the component.
import { setPhoto, setPunchListPhoto, deletePunchListPhoto as deleteDbPunchListPhoto } from '../utils/db';
import { addDays, subDays } from 'date-fns';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM'; // TODO: Move to environment variables

// Helper function to revive dates from JSON strings
const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

// Generic function to get item from localStorage
const getStoredItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        // If item doesn't exist, return the default value to populate the app
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item, reviver);
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

// Fetches the map image and converts it to a Data URL to embed it directly.
// This is more reliable for PDF generation as it avoids cross-origin issues.
const getMapImageDataUrl = async (location: Location): Promise<string | undefined> => {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=200x150&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch map image: ${response.statusText}`);
            return undefined;
        }
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching or converting map image:", error);
        return undefined;
    }
};

// --- DEFAULT DATA FOR PRE-LOADING THE APP ---
const defaultUsers: User[] = [
  {
    id: 1,
    name: 'Ryan',
    role: 'Installer',
    avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
    isClockedIn: false,
    hourlyRate: 25,
  }
];

const todayForDefaults = new Date();

const defaultProjects: Project[] = [
    {
        id: 1,
        name: 'Sally Wertman',
        address: '23296 US 12 W, Sturgis, MI 49091',
        type: ProjectType.Renovation,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 60),
        endDate: addDays(todayForDefaults, 90),
        budget: 150000,
        punchList: [
            { id: 1, text: 'Fix front door lock', isComplete: false },
            { id: 2, text: 'Paint trim in living room', isComplete: true },
            { id: 3, text: 'Repair drywall patch in hallway', isComplete: false },
        ],
        photos: [],
    },
    {
        id: 2,
        name: 'Tony Szafranski',
        address: '1370 E 720 S, Wolcottville, IN 46795',
        type: ProjectType.NewConstruction,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 45),
        endDate: addDays(todayForDefaults, 120),
        budget: 320000,
        punchList: [
             { id: 4, text: 'Install kitchen backsplash', isComplete: false },
        ],
        photos: [],
    },
    {
        id: 3,
        name: 'Joe Eicher',
        address: '6430 S 125 E, Wolcottville, IN 46795',
        type: ProjectType.InteriorFitOut,
        status: 'On Hold',
        startDate: subDays(todayForDefaults, 90),
        endDate: addDays(todayForDefaults, 60),
        budget: 75000,
        punchList: [],
        photos: [],
    },
    {
        id: 4,
        name: 'Tyler Mitchell',
        address: '785 E 660 S, Wolcottville, IN 46795',
        type: ProjectType.NewConstruction,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 15),
        endDate: addDays(todayForDefaults, 180),
        budget: 450000,
        punchList: [],
        photos: [],
    },
    {
        id: 5,
        name: 'Dennis Zmyslo',
        address: '260 Spring Beach Rd, Rome City, IN 46784',
        type: ProjectType.Renovation,
        status: 'Completed',
        startDate: subDays(todayForDefaults, 180),
        endDate: subDays(todayForDefaults, 10),
        budget: 95000,
        punchList: [],
        photos: [],
    },
    {
        id: 6,
        name: 'Stephanie Webster',
        address: '803 South Main Street, Topeka, IN 46571',
        type: ProjectType.Demolition,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 5),
        endDate: addDays(todayForDefaults, 25),
        budget: 25000,
        punchList: [],
        photos: [],
    }
];

const defaultInvoices: Invoice[] = [];


interface DataContextType {
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  invoices: Invoice[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; }) => void;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => void;
  addProject: (project: Omit<Project, 'id' | 'punchList' | 'photos'>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => void;
  toggleClockInOut: (projectId?: number) => void;
  switchJob: (newProjectId: number) => void;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrls: string[], description: string) => Promise<void>;
  addPunchListPhoto: (projectId: number, punchListItemId: number, imageDataUrl: string) => Promise<void>;
  updatePunchListAnnotation: (projectId: number, punchListItemId: number, annotatedDataUrl: string) => void;
  deletePunchListPhoto: (projectId: number, punchListItemId: number) => Promise<void>;
  addManualTimeLog: (data: { userId: number, projectId: number, clockIn: Date, clockOut: Date, notes?: string }) => void;
  updateTimeLog: (logId: number, data: { projectId: number, clockIn: Date, clockOut: Date, notes?: string }) => void;
  deleteTimeLog: (logId: number) => void;
  addInvoice: (invoiceData: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (invoiceId: number, data: Omit<Invoice, 'id'>) => Invoice;
  deleteInvoice: (invoiceId: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredItem('scc_users', defaultUsers));
  const [projects, setProjects] = useState<Project[]>(() => getStoredItem('scc_projects', defaultProjects));
  const [tasks, setTasks] = useState<Task[]>(() => getStoredItem('scc_tasks', []));
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => getStoredItem('scc_timeLogs', []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredItem('scc_invoices', defaultInvoices));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredItem('scc_currentUser', null));

  // Persist state to localStorage on changes
  useEffect(() => { localStorage.setItem('scc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('scc_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('scc_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('scc_timeLogs', JSON.stringify(timeLogs)); }, [timeLogs]);
  useEffect(() => { localStorage.setItem('scc_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('scc_currentUser', JSON.stringify(currentUser)); }, [currentUser]);

  useEffect(() => {
    if (users.length > 0 && !currentUser) {
        const storedUser = getStoredItem<User | null>('scc_currentUser', null);
        const userExists = storedUser ? users.some(u => u.id === storedUser.id) : false;
        setCurrentUser(userExists ? storedUser : users[0]);
    }
    if (users.length === 0 && currentUser) {
        setCurrentUser(null);
    }
  }, [users, currentUser]);

  const addUser = useCallback(({ name, role, hourlyRate }: { name: string; role: string; hourlyRate: number; }) => {
    setUsers(prev => {
        const newUser: User = {
          id: Math.max(0, ...prev.map(u => u.id)) + 1,
          name,
          role,
          hourlyRate,
          avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
          isClockedIn: false,
        };
        return [...prev, newUser]
    });
  }, []);

  const updateUser = useCallback((userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => {
      let updatedUser: User | null = null;
      setUsers(prev => prev.map(user => {
          if (user.id === userId) {
              updatedUser = { ...user, ...data };
              return updatedUser;
          }
          return user;
      }));
      if (currentUser?.id === userId && updatedUser) {
          setCurrentUser(updatedUser);
      }
  }, [currentUser]);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'punchList' | 'photos'>) => {
    setProjects(prev => {
        const newProject: Project = {
            ...projectData,
            id: Math.max(0, ...prev.map(p => p.id)) + 1,
            punchList: [],
            photos: [],
        };
        return [...prev, newProject];
    });
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'status'>) => {
    setTasks(prev => {
        const newTask: Task = {
            ...taskData,
            id: Math.max(0, ...prev.map(t => t.id)) + 1,
            status: TaskStatus.ToDo,
        };
        return [...prev, newTask]
    });
  }, []);

  const updateTaskStatus = useCallback((taskId: number, status: TaskStatus) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status } : task));
  }, []);

  const getCurrentLocation = useCallback((): Promise<Location | undefined> => {
      return new Promise((resolve) => {
          if (!navigator.geolocation) { 
            console.warn("Geolocation is not supported by this browser.");
            resolve(undefined);
            return;
           }
          navigator.geolocation.getCurrentPosition(
              (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
              (error) => {
                console.error("Error getting location:", error);
                alert(`Could not get location: ${error.message}`);
                resolve(undefined);
              }
          );
      });
  }, []);

  const toggleClockInOut = useCallback(async (projectId?: number) => {
    if (!currentUser) return;
    try {
        if (currentUser.isClockedIn) {
          const location = await getCurrentLocation();
          const clockInTime = currentUser.clockInTime;
          if (!clockInTime) return;
          
          const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
          if (existingLogIndex === -1) return;

          const now = new Date();
          const durationMs = now.getTime() - clockInTime.getTime();
          const hoursWorked = durationMs / (1000 * 60 * 60);
          const cost = hoursWorked * currentUser.hourlyRate;
          const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
          
          const updatedLog: TimeLog = { 
            ...timeLogs[existingLogIndex], 
            clockOut: now, 
            durationMs, 
            cost, 
            clockOutLocation: location,
            clockOutMapImage: mapImageUrl
          };
          const newTimeLogs = [...timeLogs];
          newTimeLogs[existingLogIndex] = updatedLog;

          setTimeLogs(newTimeLogs.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
          
          const updatedUser = { ...currentUser, isClockedIn: false, clockInTime: undefined, currentProjectId: undefined };
          setCurrentUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        } else {
          if (!projectId) return;
          const location = await getCurrentLocation();
          const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
          const clockInTime = new Date();
          const updatedUser = { ...currentUser, isClockedIn: true, clockInTime, currentProjectId: projectId };
          
          const newLog: TimeLog = { 
            id: Math.max(0, ...timeLogs.map(l => l.id)) + 1, 
            userId: currentUser.id, 
            projectId: projectId, 
            clockIn: clockInTime, 
            clockInLocation: location,
            clockInMapImage: mapImageUrl
          };
          setTimeLogs(prev => [newLog, ...prev]);

          setCurrentUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        }
    } catch (error) {
        console.error("Error during clock in/out:", error);
        alert("An unexpected error occurred while clocking in/out. Please try again.");
    }
  }, [currentUser, timeLogs, getCurrentLocation]);

  const switchJob = useCallback(async (newProjectId: number) => {
    if (!currentUser || !currentUser.isClockedIn) return;
    if (newProjectId === currentUser.currentProjectId) return;
    try {
        // Step 1: Clock out from the current job.
        const location = await getCurrentLocation();
        const clockInTime = currentUser.clockInTime;
        if (!clockInTime) return;
        
        const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
        if (existingLogIndex === -1) return;

        const now = new Date();
        const durationMs = now.getTime() - clockInTime.getTime();
        const hoursWorked = durationMs / (1000 * 60 * 60);
        const cost = hoursWorked * currentUser.hourlyRate;
        const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
        
        const updatedLog: TimeLog = { 
          ...timeLogs[existingLogIndex], 
          clockOut: now, 
          durationMs, 
          cost, 
          clockOutLocation: location,
          clockOutMapImage: mapImageUrl
        };
        
        const tempTimeLogs = [...timeLogs];
        tempTimeLogs[existingLogIndex] = updatedLog;

        // Step 2: Clock in to the new job immediately.
        const newLocation = await getCurrentLocation();
        const newMapImageUrl = newLocation ? await getMapImageDataUrl(newLocation) : undefined;
        const newClockInTime = new Date(); // Use a fresh timestamp for accuracy
        const updatedUser = { ...currentUser, isClockedIn: true, clockInTime: newClockInTime, currentProjectId: newProjectId };
        const newLog: TimeLog = { 
          id: Math.max(0, ...tempTimeLogs.map(l => l.id)) + 1, 
          userId: currentUser.id, 
          projectId: newProjectId, 
          clockIn: newClockInTime, 
          clockInLocation: newLocation,
          clockInMapImage: newMapImageUrl
        };
        
        setTimeLogs([newLog, ...tempTimeLogs].sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } catch (error) {
        console.error("Error switching job:", error);
        alert("An unexpected error occurred while switching jobs. Please try again.");
    }
  }, [currentUser, timeLogs, getCurrentLocation]);

  const addPunchListItem = useCallback((projectId: number, text: string) => {
    setProjects(prevProjects => {
        const allItems = prevProjects.flatMap(p => p.punchList);
        const nextId = Math.max(0, ...allItems.map(item => item.id)) + 1;
        const newItem: PunchListItem = { id: nextId, text, isComplete: false };
        return prevProjects.map(p => p.id === projectId ? { ...p, punchList: [...p.punchList, newItem] } : p);
    });
  }, []);

  const togglePunchListItem = useCallback((projectId: number, itemId: number) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, punchList: p.punchList.map(item => item.id === itemId ? { ...item, isComplete: !item.isComplete } : item) } : p));
  }, []);

  const addPhoto = useCallback(async (projectId: number, imageDataUrls: string[], description: string) => {
    let newPhotosMeta: Omit<ProjectPhoto, 'imageDataUrl'>[] = [];

    // Find project from current state to get next ID
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        throw new Error(`Project with ID ${projectId} not found.`);
    }

    const dateAdded = new Date();
    // Safely get the max id from potentially empty photos array
    const maxId = project.photos.length > 0 ? Math.max(...project.photos.map(p => p.id)) : 0;
    let nextId = maxId + 1;

    const photoSavePromises = imageDataUrls.map((url) => {
        const photoId = nextId++;
        const newPhotoMeta: Omit<ProjectPhoto, 'imageDataUrl'> = { id: photoId, description, dateAdded };
        newPhotosMeta.push(newPhotoMeta);
        return setPhoto(projectId, photoId, url);
    });

    // Try to save all photos. If any fails, Promise.all rejects.
    await Promise.all(photoSavePromises);

    // If all saves are successful, update the state.
    setProjects(prev => {
        return prev.map(p => {
            if (p.id === projectId) {
                return { ...p, photos: [...newPhotosMeta, ...p.photos] };
            }
            return p;
        });
    });
  }, [projects]);

  const addPunchListPhoto = useCallback(async (projectId: number, punchListItemId: number, imageDataUrl: string) => {
    try {
        const baseImageId = `${punchListItemId}-${Date.now()}`;
        await setPunchListPhoto(baseImageId, imageDataUrl);

        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            return {
                ...p,
                punchList: p.punchList.map(item => {
                    if (item.id === punchListItemId) {
                        return {
                            ...item,
                            photo: {
                                baseImageId,
                                annotatedImageUrl: imageDataUrl, // Initially, annotated is same as original
                            }
                        };
                    }
                    return item;
                })
            };
        }));
    } catch(err) {
        console.error("Failed to add punch list photo:", err);
        throw err; // Re-throw to be caught in the component
    }
  }, []);

  const updatePunchListAnnotation = useCallback((projectId: number, punchListItemId: number, annotatedDataUrl: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          return {
              ...p,
              punchList: p.punchList.map(item => {
                  if (item.id === punchListItemId && item.photo) {
                      return {
                          ...item,
                          photo: {
                              ...item.photo,
                              annotatedImageUrl: annotatedDataUrl,
                          }
                      };
                  }
                  return item;
              })
          };
      }));
  }, []);

  const deletePunchListPhoto = useCallback(async (projectId: number, punchListItemId: number) => {
    const project = projects.find(p => p.id === projectId);
    const item = project?.punchList.find(i => i.id === punchListItemId);
    const photoIdToDelete = item?.photo?.baseImageId;

    if (photoIdToDelete) {
        try {
            await deleteDbPunchListPhoto(photoIdToDelete);
            setProjects(prev => prev.map(p => {
                if (p.id !== projectId) return p;
                return {
                    ...p,
                    punchList: p.punchList.map(item => {
                        if (item.id === punchListItemId) {
                            const { photo, ...rest } = item;
                            return rest;
                        }
                        return item;
                    })
                };
            }));
        } catch(err) {
            console.error("Failed to delete punch list photo from DB:", err);
            throw err; // Re-throw to be caught in the component
        }
    }
  }, [projects]);

  // --- Manual Time Log Management ---
  const addManualTimeLog = useCallback(({ userId, projectId, clockIn, clockOut, notes }: { userId: number, projectId: number, clockIn: Date, clockOut: Date, notes?: string }) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const durationMs = clockOut.getTime() - clockIn.getTime();
    const cost = (durationMs / 3600000) * user.hourlyRate;

    const newLog: TimeLog = {
      id: Math.max(0, ...timeLogs.map(l => l.id)) + 1,
      userId,
      projectId,
      clockIn,
      clockOut,
      durationMs,
      cost,
      notes,
    };
    setTimeLogs(prev => [...prev, newLog].sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
  }, [users, timeLogs]);

  const updateTimeLog = useCallback((logId: number, data: { projectId: number, clockIn: Date, clockOut: Date, notes?: string }) => {
    setTimeLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const user = users.find(u => u.id === log.userId);
        if (!user) return log; // Should not happen

        const durationMs = data.clockOut.getTime() - data.clockIn.getTime();
        const cost = (durationMs / 3600000) * user.hourlyRate;
        return { ...log, ...data, durationMs, cost };
      }
      return log;
    }));
  }, [users]);

  const deleteTimeLog = useCallback((logId: number) => {
    setTimeLogs(prev => prev.filter(log => log.id !== logId));
  }, []);

  // --- Invoicing ---
  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id'>) => {
      const newInvoice: Invoice = {
          ...invoiceData,
          id: Math.max(0, ...invoices.map(i => i.id)) + 1,
      };
      setInvoices(prev => [newInvoice, ...prev].sort((a,b) => b.dateIssued.getTime() - a.dateIssued.getTime()));
      
      const billedTimeLogIds = newInvoice.lineItems.flatMap(item => item.timeLogIds || []);
      setTimeLogs(prev => prev.map(log => billedTimeLogIds.includes(log.id) ? { ...log, invoiceId: newInvoice.id } : log));
      
      return newInvoice;
  }, [invoices]);

  const updateInvoice = useCallback((invoiceId: number, data: Omit<Invoice, 'id'>) => {
      let updatedInvoice: Invoice | null = null;
      const oldInvoice = invoices.find(inv => inv.id === invoiceId);

      setInvoices(prev => prev.map(inv => {
          if (inv.id === invoiceId) {
              updatedInvoice = { ...data, id: invoiceId };
              return updatedInvoice;
          }
          return inv;
      }));

      // Update time logs
      const oldTimeLogIds = oldInvoice?.lineItems.flatMap(item => item.timeLogIds || []) || [];
      const newTimeLogIds = data.lineItems.flatMap(item => item.timeLogIds || []);
      
      setTimeLogs(prev => prev.map(log => {
          // If log was on old invoice but not new one, unbill it
          if (oldTimeLogIds.includes(log.id) && !newTimeLogIds.includes(log.id)) {
              const { invoiceId, ...rest } = log;
              return rest;
          }
          // If log is on new invoice, bill it
          if (newTimeLogIds.includes(log.id)) {
              return { ...log, invoiceId: invoiceId };
          }
          return log;
      }));

      if (!updatedInvoice) throw new Error("Invoice update failed");
      return updatedInvoice;
  }, [invoices]);

  const deleteInvoice = useCallback((invoiceId: number) => {
      const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
      if (!invoiceToDelete) return;

      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));

      // Unbill associated time logs
      const billedTimeLogIds = invoiceToDelete.lineItems.flatMap(item => item.timeLogIds || []);
      setTimeLogs(prev => prev.map(log => {
          if (billedTimeLogIds.includes(log.id)) {
              const { invoiceId, ...rest } = log;
              return rest;
          }
          return log;
      }));
  }, [invoices]);


  const value = useMemo(() => ({ 
      users, projects, tasks, timeLogs, invoices, currentUser,
      setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus, 
      toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto, 
      addPunchListPhoto, updatePunchListAnnotation, deletePunchListPhoto,
      addManualTimeLog, updateTimeLog, deleteTimeLog,
      addInvoice, updateInvoice, deleteInvoice,
  }), [
      users, projects, tasks, timeLogs, invoices, currentUser,
      addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
      switchJob, addPunchListItem, togglePunchListItem, addPhoto,
      addPunchListPhoto, updatePunchListAnnotation, deletePunchListPhoto,
      addManualTimeLog, updateTimeLog, deleteTimeLog,
      addInvoice, updateInvoice, deleteInvoice
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};