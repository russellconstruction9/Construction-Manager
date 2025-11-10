import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, InventoryItem, OrderListItem, InventoryOrderItem, ManualOrderItem, ProjectType, Invoice, Expense } from '../types';
import { userService, projectService, taskService, timeLogService, inventoryService, migrationService } from '../utils/supabaseService';
import { setPhoto } from '../utils/db';
import { addDays, subDays } from 'date-fns';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM'; // TODO: Move to environment variables

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

interface DataContextType {
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  inventory: InventoryItem[];
  orderList: OrderListItem[];
  invoices: Invoice[];
  expenses: Expense[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; email?: string; phone?: string; }) => Promise<void>;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'punchList' | 'photos'>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<void>;
  updateTaskStatus: (taskId: number, status: TaskStatus) => Promise<void>;
  toggleClockInOut: (projectId?: number) => Promise<void>;
  switchJob: (newProjectId: number) => Promise<void>;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrls: string[], description: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItemQuantity: (itemId: number, newQuantity: number) => Promise<void>;
  updateInventoryItem: (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => Promise<void>;
  addToOrderList: (itemId: number) => void;
  addManualItemToOrderList: (name: string, cost?: number) => void;
  removeFromOrderList: (item: OrderListItem) => void;
  clearOrderList: () => void;
  addInvoice: (invoiceData: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (invoiceId: number, invoiceData: Omit<Invoice, 'id'>) => Invoice;
  deleteInvoice: (invoiceId: number) => void;
  addExpense: (expenseData: Omit<Expense, 'id'>) => void;
  refreshData: () => Promise<void>;
  migrateFromLocalStorage: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('DataProvider initializing with Supabase...');
  
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orderList, setOrderList] = useState<OrderListItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data from Supabase on mount
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersData, projectsData, tasksData, timeLogsData, inventoryData] = await Promise.all([
        userService.getAll(),
        projectService.getAll(),
        taskService.getAll(),
        timeLogService.getAll(),
        inventoryService.getAll(),
      ]);

      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
      setTimeLogs(timeLogsData);
      setInventory(inventoryData);

      console.log('Data loaded successfully from Supabase');
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set current user from stored preference or first user
  useEffect(() => {
    if (users.length > 0 && !currentUser) {
      try {
        const storedUserId = localStorage.getItem('scc_currentUserId');
        const userExists = storedUserId ? users.find(u => u.id === parseInt(storedUserId)) : null;
        setCurrentUser(userExists || users[0]);
      } catch (error) {
        console.warn('Error loading current user from localStorage:', error);
        setCurrentUser(users[0]);
      }
    }
    if (users.length === 0 && currentUser) {
      setCurrentUser(null);
    }
  }, [users, currentUser]);

  // Persist current user selection
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('scc_currentUserId', currentUser.id.toString());
      } catch (error) {
        console.warn('Error saving current user to localStorage:', error);
      }
    }
  }, [currentUser]);

  // Migrate from localStorage
  const migrateFromLocalStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      await migrationService.migrateFromLocalStorage();
      await refreshData();
      await migrationService.clearLocalStorage();
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      setError('Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [refreshData]);

  const addUser = useCallback(async ({ name, role, hourlyRate, email, phone }: { name: string; role: string; hourlyRate: number; email?: string; phone?: string; }) => {
    try {
      const newUser = await userService.create({
        name,
        role,
        hourlyRate,
        email,
        phone,
        avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
        isClockedIn: false,
      });
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => {
    try {
      const updatedUser = await userService.update(userId, data);
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [currentUser]);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'punchList' | 'photos'>) => {
    try {
      const newProject = await projectService.create(projectData);
      setProjects(prev => [...prev, { ...newProject, punchList: [], photos: [] }]);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'status'>) => {
    try {
      const newTask = await taskService.create({ ...taskData, status: TaskStatus.ToDo });
      setTasks(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: number, status: TaskStatus) => {
    try {
      const updatedTask = await taskService.update(taskId, { status });
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<Location | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { 
        console.warn("Geolocation is not supported by this browser.");
        resolve(undefined);
        return;
       }

      const timeoutId = setTimeout(() => {
        console.warn("Geolocation request timed out");
        resolve(undefined);
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log("Location obtained successfully");
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error("Error getting location:", error);
          resolve(undefined);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000 // 5 minutes
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
        
        const updatedLog = await timeLogService.update(timeLogs[existingLogIndex].id, {
          clockOut: now,
          durationMs,
          cost,
          notes: mapImageUrl ? `Clock out location: ${location?.lat}, ${location?.lng}` : undefined,
        });

        setTimeLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
        
        const updatedUser = await userService.update(currentUser.id, { isClockedIn: false });
        setCurrentUser({ ...updatedUser, clockInTime: undefined, currentProjectId: undefined });
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      } else {
        if (!projectId) return;
        const location = await getCurrentLocation();
        const clockInTime = new Date();
        
        const newLog = await timeLogService.create({
          userId: currentUser.id,
          projectId,
          clockIn: clockInTime,
          notes: location ? `Clock in location: ${location.lat}, ${location.lng}` : undefined,
        });

        setTimeLogs(prev => [newLog, ...prev]);
        
        const updatedUser = await userService.update(currentUser.id, { isClockedIn: true });
        setCurrentUser({ ...updatedUser, clockInTime, currentProjectId: projectId });
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      }
    } catch (error) {
      console.error('Error toggling clock in/out:', error);
      throw error;
    }
  }, [currentUser, timeLogs, getCurrentLocation]);

  const switchJob = useCallback(async (newProjectId: number) => {
    if (!currentUser || !currentUser.isClockedIn || newProjectId === currentUser.currentProjectId) return;

    try {
      // Clock out from current job
      await toggleClockInOut();
      // Clock in to new job
      await toggleClockInOut(newProjectId);
    } catch (error) {
      console.error('Error switching jobs:', error);
      throw error;
    }
  }, [currentUser, toggleClockInOut]);

  // Punch list operations (still local until we add punch list table)
  const addPunchListItem = useCallback((projectId: number, text: string) => {
    setProjects(prevProjects => {
      const allItems = prevProjects.flatMap(p => p.punchList);
      const nextId = Math.max(0, ...allItems.map(item => item.id)) + 1;
      const newItem: PunchListItem = { id: nextId, text, isComplete: false };

      return prevProjects.map(p =>
        p.id === projectId ? { ...p, punchList: [...p.punchList, newItem] } : p
      );
    });
  }, []);

  const togglePunchListItem = useCallback((projectId: number, itemId: number) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, punchList: p.punchList.map(item => 
            item.id === itemId ? { ...item, isComplete: !item.isComplete } : item
          ) } 
        : p
    ));
  }, []);

  // Photo operations (still using IndexedDB for now)
  const addPhoto = useCallback(async (projectId: number, imageDataUrls: string[], description: string) => {
    try {
      setProjects(prev => {
        const project = prev.find(p => p.id === projectId);
        if (!project) return prev;

        const dateAdded = new Date();
        let nextId = Math.max(0, ...project.photos.map(p => p.id)) + 1;
        
        const newPhotos: ProjectPhoto[] = [];
        
        imageDataUrls.forEach((url, index) => {
          const photoId = nextId++;
          const newPhoto: ProjectPhoto = {
            id: photoId,
            description: `${description}${imageDataUrls.length > 1 ? ` (${index + 1}/${imageDataUrls.length})` : ''}`,
            dateAdded,
          };
          newPhotos.push(newPhoto);

          setPhoto(projectId, newPhoto.id, url).catch(e => {
            console.error(`Failed to add photo ${photoId}:`, e);
          });
        });

        const updatedPhotos = [...newPhotos, ...project.photos];
        return prev.map(p => p.id === projectId ? { ...p, photos: updatedPhotos } : p);
      });
    } catch (error) {
      console.error('Error adding photos:', error);
      throw error;
    }
  }, []);

  const addInventoryItem = useCallback(async (itemData: Omit<InventoryItem, 'id'>) => {
    try {
      const newItem = await inventoryService.create(itemData);
      setInventory(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }, []);

  const updateInventoryItemQuantity = useCallback(async (itemId: number, newQuantity: number) => {
    try {
      const updatedItem = await inventoryService.update(itemId, { quantity: Math.max(0, newQuantity) });
      setInventory(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      throw error;
    }
  }, []);

  const updateInventoryItem = useCallback(async (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => {
    try {
      const updatedItem = await inventoryService.update(itemId, data);
      setInventory(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }, []);

  // Order list operations (local state for now)
  const addToOrderList = useCallback((itemId: number) => {
    setOrderList(prev => {
      const exists = prev.some(item => item.type === 'inventory' && item.itemId === itemId);
      if (exists) return prev;
      const newItem: InventoryOrderItem = { type: 'inventory', itemId };
      return [...prev, newItem];
    });
  }, []);

  const addManualItemToOrderList = useCallback((name: string, cost?: number) => {
    setOrderList(prev => {
      const manualOrderItems = prev.filter(item => item.type === 'manual') as ManualOrderItem[];
      const newId = Math.max(0, ...manualOrderItems.map(i => i.id)) + 1;
      const newItem: ManualOrderItem = { type: 'manual', id: newId, name, cost };
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

  // Invoice operations (local for now - would need invoice table)
  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id'>) => {
    let newInvoice: Invoice | null = null;
    setInvoices(prev => {
      const nextId = Math.max(0, ...prev.map(i => i.id)) + 1;
      newInvoice = { ...invoiceData, id: nextId };
      return [...prev, newInvoice].sort((a, b) => b.dateIssued.getTime() - a.dateIssued.getTime());
    });

    const timeLogIdsToUpdate = invoiceData.lineItems.flatMap(item => item.timeLogIds || []);
    if (timeLogIdsToUpdate.length > 0 && newInvoice) {
      setTimeLogs(prev => prev.map(log => 
        timeLogIdsToUpdate.includes(log.id) ? { ...log, invoiceId: newInvoice!.id } : log
      ));
    }
    return newInvoice!;
  }, []);

  const updateInvoice = useCallback((invoiceId: number, invoiceData: Omit<Invoice, 'id'>) => {
    let updatedInvoice: Invoice | null = null;
    setTimeLogs(prevTimeLogs => {
      const originalInvoice = invoices.find(inv => inv.id === invoiceId);
      const originalTimeLogIds = originalInvoice?.lineItems.flatMap(item => item.timeLogIds || []) || [];
      const newTimeLogIds = invoiceData.lineItems.flatMap(item => item.timeLogIds || []);

      return prevTimeLogs.map(log => {
        if (originalTimeLogIds.includes(log.id) && !newTimeLogIds.includes(log.id)) {
          const { invoiceId, ...rest } = log;
          return rest;
        }
        if (newTimeLogIds.includes(log.id)) {
          return { ...log, invoiceId: invoiceId };
        }
        return log;
      });
    });

    setInvoices(prev => {
      return prev.map(inv => {
        if (inv.id === invoiceId) {
          updatedInvoice = { ...invoiceData, id: invoiceId };
          return updatedInvoice;
        }
        return inv;
      }).sort((a, b) => b.dateIssued.getTime() - a.dateIssued.getTime());
    });
    return updatedInvoice!;
  }, [invoices]);

  const deleteInvoice = useCallback((invoiceId: number) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    const timeLogIdsToUnbill = invoiceToDelete?.lineItems.flatMap(item => item.timeLogIds || []) || [];
    
    if (timeLogIdsToUnbill.length > 0) {
      setTimeLogs(prev => prev.map(log => {
        if (timeLogIdsToUnbill.includes(log.id)) {
          const { invoiceId, ...rest } = log;
          return rest;
        }
        return log;
      }));
    }

    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  }, [invoices]);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
      const newExpense: Expense = {
        ...expenseData,
        id: Math.max(0, ...prev.map(e => e.id)) + 1,
      };
      return [...prev, newExpense].sort((a, b) => b.date.getTime() - a.date.getTime());
    });
  }, []);

  const value = useMemo(() => ({ 
    users, projects, tasks, timeLogs, inventory, orderList, currentUser, invoices, expenses,
    isLoading, error,
    setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus, 
    toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto, 
    addInventoryItem, updateInventoryItemQuantity, updateInventoryItem, addToOrderList, 
    addManualItemToOrderList, removeFromOrderList, clearOrderList, 
    addInvoice, updateInvoice, deleteInvoice, addExpense, refreshData, migrateFromLocalStorage,
  }), [
    users, projects, tasks, timeLogs, inventory, orderList, currentUser, invoices, expenses,
    isLoading, error,
    addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
    switchJob, addPunchListItem, togglePunchListItem, addPhoto, addInventoryItem,
    updateInventoryItemQuantity, updateInventoryItem, addToOrderList, addManualItemToOrderList,
    removeFromOrderList, clearOrderList, addInvoice, updateInvoice, deleteInvoice, addExpense,
    refreshData, migrateFromLocalStorage
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { 
    throw new Error('useData must be used within a DataProvider'); 
  }
  return context;
};