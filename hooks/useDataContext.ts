import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, InventoryItem, OrderListItem, InventoryOrderItem, ManualOrderItem } from '../types';
import { setPhoto } from '../utils/db';

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
        return item ? JSON.parse(item, reviver) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

const getMapImageUrl = async (location: Location): Promise<string | undefined> => {
    if (!process.env.API_KEY) {
        console.error("Google Maps API key is missing.");
        return undefined;
    }
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=200x150&maptype=roadmap&markers=color:red%7C${location.lat},${location.lng}&key=${process.env.API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Failed to fetch map image:", response.statusText);
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

interface DataContextType {
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  inventory: InventoryItem[];
  orderList: OrderListItem[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; }) => void;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => void;
  addProject: (project: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => void;
  toggleClockInOut: (projectId?: number) => void;
  switchJob: (newProjectId: number) => void;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrl: string, description: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItemQuantity: (itemId: number, newQuantity: number) => void;
  updateInventoryItem: (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => void;
  addToOrderList: (itemId: number) => void;
  addManualItemToOrderList: (name: string) => void;
  removeFromOrderList: (item: OrderListItem) => void;
  clearOrderList: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredItem('scc_users', []));
  const [projects, setProjects] = useState<Project[]>(() => getStoredItem('scc_projects', []));
  const [tasks, setTasks] = useState<Task[]>(() => getStoredItem('scc_tasks', []));
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => getStoredItem('scc_timeLogs', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredItem('scc_inventory', []));
  const [orderList, setOrderList] = useState<OrderListItem[]>(() => getStoredItem('scc_orderList', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredItem('scc_currentUser', null));

  // Persist state to localStorage on changes
  useEffect(() => { localStorage.setItem('scc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('scc_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('scc_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('scc_timeLogs', JSON.stringify(timeLogs)); }, [timeLogs]);
  useEffect(() => { localStorage.setItem('scc_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('scc_orderList', JSON.stringify(orderList)); }, [orderList]);
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
                alert(`Could not get location: ${error.message}`);
                resolve(undefined);
              }
          );
      });
  }, []);

  const toggleClockInOut = useCallback((projectId?: number) => {
    if (!currentUser) return;

    if (currentUser.isClockedIn) {
      getCurrentLocation().then(async location => {
          const clockInTime = currentUser.clockInTime;
          if (!clockInTime) return;
          const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
          if (existingLogIndex === -1) return;

          const now = new Date();
          const durationMs = now.getTime() - clockInTime.getTime();
          const hoursWorked = durationMs / (1000 * 60 * 60);
          const cost = hoursWorked * currentUser.hourlyRate;
          const mapImageUrl = location ? await getMapImageUrl(location) : undefined;
          
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
          setProjects(prev => prev.map(p => p.id === clockedOutProjectId ? { ...p, currentSpend: p.currentSpend + cost } : p));
      });
    } else {
      if (!projectId) return;
      getCurrentLocation().then(async location => {
          const mapImageUrl = location ? await getMapImageUrl(location) : undefined;
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
      });
    }
  }, [currentUser, timeLogs, getCurrentLocation]);

  const switchJob = useCallback((newProjectId: number) => {
    if (!currentUser || !currentUser.isClockedIn) return;
    if (newProjectId === currentUser.currentProjectId) return;

    // Step 1: Clock out from the current job.
    getCurrentLocation().then(async location => {
        const clockInTime = currentUser.clockInTime;
        if (!clockInTime) return;
        
        const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
        if (existingLogIndex === -1) return;

        const now = new Date();
        const durationMs = now.getTime() - clockInTime.getTime();
        const hoursWorked = durationMs / (1000 * 60 * 60);
        const cost = hoursWorked * currentUser.hourlyRate;
        const mapImageUrl = location ? await getMapImageUrl(location) : undefined;
        
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

        // Step 2: Clock in to the new job immediately.
        getCurrentLocation().then(async newLocation => {
            const newMapImageUrl = newLocation ? await getMapImageUrl(newLocation) : undefined;
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
            setProjects(tempProjects);
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        });
    });
  }, [currentUser, timeLogs, projects, getCurrentLocation]);

  const addPunchListItem = useCallback((projectId: number, text: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, punchList: [...p.punchList, { id: Math.max(0, ...p.punchList.map(item => item.id)) + 1, text, isComplete: false }] } : p));
  }, []);

  const togglePunchListItem = useCallback((projectId: number, itemId: number) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, punchList: p.punchList.map(item => item.id === itemId ? { ...item, isComplete: !item.isComplete } : item) } : p));
  }, []);

  const addPhoto = useCallback(async (projectId: number, imageDataUrl: string, description: string) => {
    setProjects(prev => {
        const project = prev.find(p => p.id === projectId);
        if (!project) return prev;
    
        const newPhoto: Omit<ProjectPhoto, 'imageDataUrl'> = {
          id: Math.max(0, ...project.photos.map(p => p.id)) + 1,
          description,
          dateAdded: new Date(),
        };
    
        setPhoto(projectId, newPhoto.id, imageDataUrl).catch(e => {
            console.error("Failed to add photo", e);
            alert("There was an error saving the photo. The storage might be full.");
        });

        return prev.map(p => p.id === projectId ? { ...p, photos: [newPhoto, ...p.photos] } : p);
    });
  }, []);

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


  const value = useMemo(() => ({ 
      users, projects, tasks, timeLogs, inventory, orderList, currentUser, 
      setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus, 
      toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto, 
      addInventoryItem, updateInventoryItemQuantity, updateInventoryItem, addToOrderList, 
      addManualItemToOrderList, removeFromOrderList, clearOrderList 
  }), [
      users, projects, tasks, timeLogs, inventory, orderList, currentUser,
      addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
      switchJob, addPunchListItem, togglePunchListItem, addPhoto, addInventoryItem,
      updateInventoryItemQuantity, updateInventoryItem, addToOrderList, addManualItemToOrderList,
      removeFromOrderList, clearOrderList
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};