
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, InventoryItem, OrderListItem, InventoryOrderItem, ManualOrderItem, ProjectType, UserRole, Estimate, Expense, EstimateItem } from '../types';
import { setPhoto } from '../utils/db';
import { addDays, subDays } from 'date-fns';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

const getStoredItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item, reviver);
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

const getMapImageDataUrl = async (location: Location): Promise<string | undefined> => {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=200x150&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const fetchWithTimeout = (url: string, ms: number) => {
        const controller = new AbortController();
        const promise = fetch(url, { signal: controller.signal });
        const timeout = setTimeout(() => controller.abort(), ms);
        return promise.finally(() => clearTimeout(timeout));
    };

    try {
        const response = await fetchWithTimeout(url, 5000); 
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

const defaultUsers: User[] = [];
const defaultProjects: Project[] = [];

interface DataContextType {
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  inventory: InventoryItem[];
  orderList: OrderListItem[];
  estimates: Estimate[];
  expenses: Expense[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; roleType: UserRole; }) => void;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => void;
  addProject: (project: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => void;
  toggleClockInOut: (projectId?: number) => void;
  switchJob: (newProjectId: number) => void;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrls: string[], description: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItemQuantity: (itemId: number, newQuantity: number) => void;
  updateInventoryItem: (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => void;
  addToOrderList: (itemId: number) => void;
  addManualItemToOrderList: (name: string) => void;
  removeFromOrderList: (item: OrderListItem) => void;
  clearOrderList: () => void;
  addEstimate: (estimate: Omit<Estimate, 'id'>) => void;
  updateEstimateStatus: (id: number, status: 'Draft' | 'Approved' | 'Rejected') => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredItem('scc_users', defaultUsers));
  const [projects, setProjects] = useState<Project[]>(() => getStoredItem('scc_projects', defaultProjects));
  const [tasks, setTasks] = useState<Task[]>(() => getStoredItem('scc_tasks', []));
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => getStoredItem('scc_timeLogs', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredItem('scc_inventory', []));
  const [orderList, setOrderList] = useState<OrderListItem[]>(() => getStoredItem('scc_orderList', []));
  const [estimates, setEstimates] = useState<Estimate[]>(() => getStoredItem('scc_estimates', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredItem('scc_expenses', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredItem('scc_currentUser', null));

  useEffect(() => { localStorage.setItem('scc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('scc_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('scc_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('scc_timeLogs', JSON.stringify(timeLogs)); }, [timeLogs]);
  useEffect(() => { localStorage.setItem('scc_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('scc_orderList', JSON.stringify(orderList)); }, [orderList]);
  useEffect(() => { localStorage.setItem('scc_estimates', JSON.stringify(estimates)); }, [estimates]);
  useEffect(() => { localStorage.setItem('scc_expenses', JSON.stringify(expenses)); }, [expenses]);
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

  const addUser = useCallback(({ name, role, hourlyRate, roleType }: { name: string; role: string; hourlyRate: number; roleType: UserRole; }) => {
    setUsers(prev => {
        const newUser: User = {
          id: Math.max(0, ...prev.map(u => u.id)) + 1,
          name,
          role,
          roleType,
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

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => {
    setProjects(prev => {
        const newProject: Project = {
            ...projectData,
            id: Math.max(0, ...prev.map(p => p.id)) + 1,
            currentSpend: 0,
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
                resolve(undefined);
              },
              { timeout: 10000, maximumAge: 60000 }
          );
      });
  }, []);

  const toggleClockInOut = useCallback(async (projectId?: number) => {
    if (!currentUser) return;

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
      
      let mapImageUrl: string | undefined = undefined;
      if (location) {
          try {
             mapImageUrl = await getMapImageDataUrl(location);
          } catch (e) {
              console.warn("Could not get map image during clock out", e);
          }
      }
      
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

      const clockedOutProjectId = timeLogs[existingLogIndex].projectId;
      // We still update currentSpend for legacy support, though JobCosting now handles it dynamically
      setProjects(prev => prev.map(p => p.id === clockedOutProjectId ? { ...p, currentSpend: p.currentSpend + cost } : p));
    } else {
      if (!projectId) return;
      const location = await getCurrentLocation();
      let mapImageUrl: string | undefined = undefined;
      if (location) {
          try {
             mapImageUrl = await getMapImageDataUrl(location);
          } catch (e) {
              console.warn("Could not get map image during clock in", e);
          }
      }

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
  }, [currentUser, timeLogs, projects, getCurrentLocation]);

  const switchJob = useCallback(async (newProjectId: number) => {
    if (!currentUser || !currentUser.isClockedIn) return;
    if (newProjectId === currentUser.currentProjectId) return;

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

    const clockedOutProjectId = timeLogs[existingLogIndex].projectId;
    const tempProjects = projects.map(p => p.id === clockedOutProjectId ? { ...p, currentSpend: p.currentSpend + cost } : p);

    const newLocation = await getCurrentLocation();
    const newMapImageUrl = newLocation ? await getMapImageDataUrl(newLocation) : undefined;
    const newClockInTime = new Date();
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
    setProjects(tempProjects);
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  }, [currentUser, timeLogs, projects, getCurrentLocation]);

  const addPunchListItem = useCallback((projectId: number, text: string) => {
    setProjects(prevProjects => {
        const allItems = prevProjects.flatMap(p => p.punchList || []);
        const nextId = Math.max(0, ...allItems.map(item => item.id)) + 1;

        const newItem: PunchListItem = {
            id: nextId,
            text,
            isComplete: false,
        };

        return prevProjects.map(p =>
            p.id === projectId
                ? { ...p, punchList: [...(p.punchList || []), newItem] }
                : p
        );
    });
  }, []);

  const togglePunchListItem = useCallback((projectId: number, itemId: number) => {
    setProjects(prev => prev.map(p => 
        p.id === projectId 
            ? { ...p, punchList: (p.punchList || []).map(item => item.id === itemId ? { ...item, isComplete: !item.isComplete } : item) } 
            : p
    ));
  }, []);

  const addPhoto = useCallback(async (projectId: number, imageDataUrls: string[], description: string) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
          throw new Error("Project not found");
      }
      
      const dateAdded = new Date();
      const currentPhotos = project.photos || [];
      let nextId = Math.max(0, ...currentPhotos.map(p => p.id)) + 1;
      
      const newPhotos: Omit<ProjectPhoto, 'imageDataUrl'>[] = [];
      const dbPromises: Promise<void>[] = [];
      
      for (const url of imageDataUrls) {
          const photoId = nextId++;
          const newPhoto: Omit<ProjectPhoto, 'imageDataUrl'> = {
              id: photoId,
              description,
              dateAdded,
          };
          newPhotos.push(newPhoto);
          dbPromises.push(setPhoto(projectId, photoId, url));
      }
      
      try {
          await Promise.all(dbPromises);
      } catch (error: any) {
          console.error("Failed to save photos to DB", error);
          if (error.message === 'Storage quota exceeded') {
               throw new Error("Storage Limit Reached. Please delete old photos or projects to free up space.");
          } else {
               throw new Error("Failed to save photo to database. Please try again.");
          }
      }
      
      setProjects(prev => {
          return prev.map(p => {
              if (p.id === projectId) {
                  return {
                      ...p,
                      photos: [...newPhotos, ...(p.photos || [])]
                  };
              }
              return p;
          });
      });
  }, [projects]);

  const addInventoryItem = useCallback((itemData: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => {
        const newItem: InventoryItem = {
            ...itemData,
            id: Math.max(0, ...prev.map(i => i.id)) + 1,
        };
        return [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name));
    });
  }, []);

  const updateInventoryItemQuantity = useCallback((itemId: number, newQuantity: number) => {
      setInventory(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item));
  }, []);

  const updateInventoryItem = useCallback((itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, ...data } : item));
  }, []);

  const addToOrderList = useCallback((itemId: number) => {
    setOrderList(prev => {
        const exists = prev.some(item => item.type === 'inventory' && item.itemId === itemId);
        if (exists) return prev;
        const newItem: InventoryOrderItem = { type: 'inventory', itemId };
        return [...prev, newItem];
    });
  }, []);

  const addManualItemToOrderList = useCallback((name: string) => {
    setOrderList(prev => {
        const manualOrderItems = prev.filter(item => item.type === 'manual') as ManualOrderItem[];
        const newId = Math.max(0, ...manualOrderItems.map(i => i.id)) + 1;
        const newItem: ManualOrderItem = { type: 'manual', id: newId, name };
        return [...prev, newItem];
    });
  }, []);

  const removeFromOrderList = useCallback((itemToRemove: OrderListItem) => {
    setOrderList(prev => prev.filter(item => {
        if (item.type !== itemToRemove.type) return true;
        if (item.type === 'inventory' && itemToRemove.type === 'inventory') {
            return item.itemId !== itemToRemove.itemId;
        }
        if (item.type === 'manual' && itemToRemove.type === 'manual') {
            return item.id !== itemToRemove.id;
        }
        return true;
    }));
  }, []);

  const clearOrderList = useCallback(() => {
    setOrderList([]);
  }, []);

  const addEstimate = useCallback((estimateData: Omit<Estimate, 'id'>) => {
    setEstimates(prev => {
        const newEstimate: Estimate = {
            ...estimateData,
            id: Math.max(0, ...prev.map(e => e.id)) + 1,
        };
        return [...prev, newEstimate];
    });
  }, []);

  const updateEstimateStatus = useCallback((id: number, status: 'Draft' | 'Approved' | 'Rejected') => {
    setEstimates(prev => prev.map(est => est.id === id ? { ...est, status } : est));
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
        const newExpense: Expense = {
            ...expenseData,
            id: Math.max(0, ...prev.map(e => e.id)) + 1,
        };
        return [...prev, newExpense];
    });
  }, []);

  const deleteExpense = useCallback((id: number) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);


  const value = useMemo(() => ({ 
      users, projects, tasks, timeLogs, inventory, orderList, estimates, expenses, currentUser, 
      setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus, 
      toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto, 
      addInventoryItem, updateInventoryItemQuantity, updateInventoryItem, addToOrderList, 
      addManualItemToOrderList, removeFromOrderList, clearOrderList,
      addEstimate, updateEstimateStatus, addExpense, deleteExpense
  }), [
      users, projects, tasks, timeLogs, inventory, orderList, estimates, expenses, currentUser,
      addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
      switchJob, addPunchListItem, togglePunchListItem, addPhoto, addInventoryItem,
      updateInventoryItemQuantity, updateInventoryItem, addToOrderList, addManualItemToOrderList,
      removeFromOrderList, clearOrderList, addEstimate, updateEstimateStatus, addExpense, deleteExpense
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};
