import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, InventoryItem, OrderListItem, InventoryOrderItem, ManualOrderItem, ProjectType, UserRole, Estimate, Expense, EstimateItem } from '../types';
import { supabase, uploadFile, getPublicUrl, STORAGE_BUCKETS } from '../utils/supabase';
import { useAuth } from './useAuth';
import { useSupabase } from './useSupabase';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

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
  loading: boolean;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; roleType: UserRole; }) => Promise<void>;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<void>;
  updateTaskStatus: (taskId: number, status: TaskStatus) => Promise<void>;
  toggleClockInOut: (projectId?: number) => Promise<void>;
  switchJob: (newProjectId: number) => Promise<void>;
  addPunchListItem: (projectId: number, text: string) => Promise<void>;
  togglePunchListItem: (projectId: number, itemId: number) => Promise<void>;
  addPhoto: (projectId: number, imageFiles: File[], description: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItemQuantity: (itemId: number, newQuantity: number) => Promise<void>;
  updateInventoryItem: (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => Promise<void>;
  addToOrderList: (itemId: number) => Promise<void>;
  addManualItemToOrderList: (name: string) => Promise<void>;
  removeFromOrderList: (item: OrderListItem) => Promise<void>;
  clearOrderList: () => Promise<void>;
  addEstimate: (estimate: Omit<Estimate, 'id'>) => Promise<void>;
  updateEstimateStatus: (id: number, status: 'Draft' | 'Approved' | 'Rejected') => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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

const getCurrentLocation = (): Promise<Location | undefined> => {
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
};

export const SupabaseDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile, organization } = useSupabase();
  
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orderList, setOrderList] = useState<OrderListItem[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Supabase profile to User type
  const convertProfileToUser = useCallback((profileData: any): User => {
    return {
      id: profileData.id,
      name: profileData.full_name,
      role: profileData.role_title,
      roleType: profileData.role_type as UserRole,
      hourlyRate: parseFloat(profileData.hourly_rate || 0),
      avatarUrl: profileData.avatar_url || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
      isClockedIn: false,
    };
  }, []);

  // Fetch all data from Supabase
  const fetchData = useCallback(async () => {
    if (!user || !organization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch users (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      const usersData = (profilesData || []).map(convertProfileToUser);
      setUsers(usersData);

      // Set current user
      const current = usersData.find(u => u.id === user.id);
      if (current) setCurrentUser(current);

      // Fetch projects with punch lists and photos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          punch_list_items(*),
          project_photos(*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projects = (projectsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        type: p.project_type as ProjectType,
        status: p.status,
        startDate: new Date(p.start_date),
        endDate: new Date(p.end_date),
        budget: parseFloat(p.budget),
        currentSpend: 0, // Calculated from time logs
        punchList: (p.punch_list_items || []).map((item: any) => ({
          id: item.id,
          text: item.text,
          isComplete: item.is_complete,
        })),
        photos: (p.project_photos || []).map((photo: any) => ({
          id: photo.id,
          description: photo.description || '',
          dateAdded: new Date(photo.created_at),
          imageDataUrl: getPublicUrl(STORAGE_BUCKETS.PROJECT_PHOTOS, photo.storage_path),
        })),
      }));
      setProjects(projects);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const tasks = (tasksData || []).map((t: any) => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description || '',
        assigneeId: t.assignee_id,
        dueDate: new Date(t.due_date),
        status: t.status as TaskStatus,
      }));
      setTasks(tasks);

      // Fetch time logs
      const { data: timeLogsData, error: timeLogsError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('clock_in', { ascending: false });

      if (timeLogsError) throw timeLogsError;

      const timeLogs = (timeLogsData || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        projectId: t.project_id,
        clockIn: new Date(t.clock_in),
        clockOut: t.clock_out ? new Date(t.clock_out) : undefined,
        durationMs: t.duration_ms ? parseInt(t.duration_ms) : undefined,
        cost: t.cost ? parseFloat(t.cost) : undefined,
        clockInLocation: t.clock_in_location,
        clockOutLocation: t.clock_out_location,
        clockInMapImage: t.clock_in_map_image,
        clockOutMapImage: t.clock_out_map_image,
      }));
      setTimeLogs(timeLogs);

      // Check for active time log and update current user
      const activeLog = timeLogs.find(log => log.userId === user.id && !log.clockOut);
      if (activeLog && current) {
        setCurrentUser({
          ...current,
          isClockedIn: true,
          clockInTime: activeLog.clockIn,
          currentProjectId: activeLog.projectId,
        });
      }

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      if (inventoryError) throw inventoryError;

      const inventory = (inventoryData || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        lowStockThreshold: i.low_stock_threshold,
      }));
      setInventory(inventory);

      // Fetch order list
      const { data: orderListData, error: orderListError } = await supabase
        .from('order_list')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at');

      if (orderListError) throw orderListError;

      const orderList: OrderListItem[] = (orderListData || []).map((o: any) => {
        if (o.item_type === 'inventory') {
          return { type: 'inventory', itemId: o.inventory_item_id } as InventoryOrderItem;
        } else {
          return { type: 'manual', id: o.id, name: o.manual_item_name } as ManualOrderItem;
        }
      });
      setOrderList(orderList);

      // Fetch estimates with items
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('estimates')
        .select(`
          *,
          estimate_items(*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (estimatesError) throw estimatesError;

      const estimates = (estimatesData || []).map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        name: e.name,
        status: e.status as 'Draft' | 'Approved' | 'Rejected',
        items: (e.estimate_items || []).map((item: any) => ({
          type: item.item_type,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitCost: parseFloat(item.unit_cost),
          totalCost: parseFloat(item.total_cost),
          estimatedHours: item.estimated_hours ? parseFloat(item.estimated_hours) : undefined,
        })),
        totalAmount: parseFloat(e.total_amount),
        totalEstimatedHours: parseFloat(e.total_estimated_hours),
      }));
      setEstimates(estimates);

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      const expenses = (expensesData || []).map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        description: e.description,
        amount: parseFloat(e.amount),
        date: new Date(e.expense_date),
        category: e.category,
        receiptUrl: e.receipt_url,
      }));
      setExpenses(expenses);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, organization, convertProfileToUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add user
  const addUser = useCallback(async ({ name, role, hourlyRate, roleType }: { name: string; role: string; hourlyRate: number; roleType: UserRole; }) => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        organization_id: organization.id,
        full_name: name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@temp.com`, // Placeholder
        role_title: role,
        role_type: roleType,
        hourly_rate: hourlyRate,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchData();
  }, [organization, fetchData]);

  // Update user
  const updateUser = useCallback(async (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => {
    const updateData: any = {};
    if (data.name) updateData.full_name = data.name;
    if (data.role) updateData.role_title = data.role;
    if (data.roleType) updateData.role_type = data.roleType;
    if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate;
    if (data.avatarUrl) updateData.avatar_url = data.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  // Add project
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'currentSpend' | 'punchList' | 'photos'>) => {
    if (!organization?.id || !user?.id) return;

    const { error } = await supabase
      .from('projects')
      .insert({
        organization_id: organization.id,
        name: projectData.name,
        address: projectData.address,
        project_type: projectData.type,
        status: projectData.status,
        start_date: projectData.startDate.toISOString().split('T')[0],
        end_date: projectData.endDate.toISOString().split('T')[0],
        budget: projectData.budget,
        created_by: user.id,
      });

    if (error) throw error;
    await fetchData();
  }, [organization, user, fetchData]);

  // Add task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'status'>) => {
    if (!organization?.id) return;

    const { error } = await supabase
      .from('tasks')
      .insert({
        organization_id: organization.id,
        project_id: taskData.projectId,
        title: taskData.title,
        description: taskData.description,
        assignee_id: taskData.assigneeId,
        due_date: taskData.dueDate.toISOString().split('T')[0],
        status: 'To Do',
      });

    if (error) throw error;
    await fetchData();
  }, [organization, fetchData]);

  // Update task status
  const updateTaskStatus = useCallback(async (taskId: number, status: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  // Toggle clock in/out
  const toggleClockInOut = useCallback(async (projectId?: number) => {
    if (!currentUser || !organization?.id) return;

    if (currentUser.isClockedIn) {
      // Clock out
      const location = await getCurrentLocation();
      const activeLog = timeLogs.find(log => log.userId === currentUser.id && !log.clockOut);
      if (!activeLog) return;

      const now = new Date();
      const durationMs = now.getTime() - activeLog.clockIn.getTime();
      const hoursWorked = durationMs / (1000 * 60 * 60);
      const cost = hoursWorked * currentUser.hourlyRate;

      let mapImageUrl: string | undefined = undefined;
      if (location) {
        const mapDataUrl = await getMapImageDataUrl(location);
        if (mapDataUrl) {
          // Upload map image to storage
          const blob = await fetch(mapDataUrl).then(r => r.blob());
          const path = `${organization.id}/${activeLog.id}_clockout_${Date.now()}.png`;
          await uploadFile(STORAGE_BUCKETS.MAP_IMAGES, path, blob, { contentType: 'image/png' });
          mapImageUrl = path;
        }
      }

      const { error } = await supabase
        .from('time_logs')
        .update({
          clock_out: now.toISOString(),
          duration_ms: durationMs,
          cost,
          clock_out_location: location,
          clock_out_map_image: mapImageUrl,
        })
        .eq('id', activeLog.id);

      if (error) throw error;
    } else {
      // Clock in
      if (!projectId) return;
      const location = await getCurrentLocation();

      let mapImageUrl: string | undefined = undefined;
      if (location) {
        const mapDataUrl = await getMapImageDataUrl(location);
        if (mapDataUrl) {
          const blob = await fetch(mapDataUrl).then(r => r.blob());
          const path = `${organization.id}/clockin_${Date.now()}.png`;
          await uploadFile(STORAGE_BUCKETS.MAP_IMAGES, path, blob, { contentType: 'image/png' });
          mapImageUrl = path;
        }
      }

      const { error } = await supabase
        .from('time_logs')
        .insert({
          organization_id: organization.id,
          user_id: currentUser.id,
          project_id: projectId,
          clock_in: new Date().toISOString(),
          clock_in_location: location,
          clock_in_map_image: mapImageUrl,
        });

      if (error) throw error;
    }

    await fetchData();
  }, [currentUser, timeLogs, organization, fetchData]);

  // Switch job
  const switchJob = useCallback(async (newProjectId: number) => {
    if (!currentUser?.isClockedIn || newProjectId === currentUser.currentProjectId) return;
    
    await toggleClockInOut(); // Clock out
    await toggleClockInOut(newProjectId); // Clock in to new project
  }, [currentUser, toggleClockInOut]);

  // Add punch list item
  const addPunchListItem = useCallback(async (projectId: number, text: string) => {
    if (!organization?.id) return;

    const { error } = await supabase
      .from('punch_list_items')
      .insert({
        organization_id: organization.id,
        project_id: projectId,
        text,
        is_complete: false,
      });

    if (error) throw error;
    await fetchData();
  }, [organization, fetchData]);

  // Toggle punch list item
  const togglePunchListItem = useCallback(async (projectId: number, itemId: number) => {
    const project = projects.find(p => p.id === projectId);
    const item = project?.punchList?.find(i => i.id === itemId);
    if (!item) return;

    const { error } = await supabase
      .from('punch_list_items')
      .update({ is_complete: !item.isComplete })
      .eq('id', itemId);

    if (error) throw error;
    await fetchData();
  }, [projects, fetchData]);

  // Add photo
  const addPhoto = useCallback(async (projectId: number, imageFiles: File[], description: string) => {
    if (!organization?.id || !user?.id) return;

    for (const file of imageFiles) {
      const path = `${organization.id}/${projectId}/${Date.now()}_${file.name}`;
      await uploadFile(STORAGE_BUCKETS.PROJECT_PHOTOS, path, file, { contentType: file.type });

      await supabase
        .from('project_photos')
        .insert({
          organization_id: organization.id,
          project_id: projectId,
          storage_path: path,
          description,
          uploaded_by: user.id,
        });
    }

    await fetchData();
  }, [organization, user, fetchData]);

  // Add inventory item
  const addInventoryItem = useCallback(async (itemData: Omit<InventoryItem, 'id'>) => {
    if (!organization?.id) return;

    const { error } = await supabase
      .from('inventory_items')
      .insert({
        organization_id: organization.id,
        name: itemData.name,
        quantity: itemData.quantity,
        unit: itemData.unit,
        low_stock_threshold: itemData.lowStockThreshold,
      });

    if (error) throw error;
    await fetchData();
  }, [organization, fetchData]);

  // Update inventory item quantity
  const updateInventoryItemQuantity = useCallback(async (itemId: number, newQuantity: number) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity: Math.max(0, newQuantity) })
      .eq('id', itemId);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  // Update inventory item
  const updateInventoryItem = useCallback(async (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.unit) updateData.unit = data.unit;
    if (data.lowStockThreshold !== undefined) updateData.low_stock_threshold = data.lowStockThreshold;

    const { error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', itemId);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  // Add to order list
  const addToOrderList = useCallback(async (itemId: number) => {
    if (!organization?.id || !user?.id) return;

    const exists = orderList.some(item => item.type === 'inventory' && item.itemId === itemId);
    if (exists) return;

    const { error } = await supabase
      .from('order_list')
      .insert({
        organization_id: organization.id,
        item_type: 'inventory',
        inventory_item_id: itemId,
        created_by: user.id,
      });

    if (error) throw error;
    await fetchData();
  }, [organization, user, orderList, fetchData]);

  // Add manual item to order list
  const addManualItemToOrderList = useCallback(async (name: string) => {
    if (!organization?.id || !user?.id) return;

    const { error } = await supabase
      .from('order_list')
      .insert({
        organization_id: organization.id,
        item_type: 'manual',
        manual_item_name: name,
        created_by: user.id,
      });

    if (error) throw error;
    await fetchData();
  }, [organization, user, fetchData]);

  // Remove from order list
  const removeFromOrderList = useCallback(async (itemToRemove: OrderListItem) => {
    if (itemToRemove.type === 'inventory') {
      const { error } = await supabase
        .from('order_list')
        .delete()
        .eq('item_type', 'inventory')
        .eq('inventory_item_id', itemToRemove.itemId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('order_list')
        .delete()
        .eq('id', itemToRemove.id);

      if (error) throw error;
    }

    await fetchData();
  }, [fetchData]);

  // Clear order list
  const clearOrderList = useCallback(async () => {
    if (!organization?.id) return;

    const { error } = await supabase
      .from('order_list')
      .delete()
      .eq('organization_id', organization.id);

    if (error) throw error;
    await fetchData();
  }, [organization, fetchData]);

  // Add estimate
  const addEstimate = useCallback(async (estimateData: Omit<Estimate, 'id'>) => {
    if (!organization?.id || !user?.id) return;

    const { data: estimateRecord, error: estimateError } = await supabase
      .from('estimates')
      .insert({
        organization_id: organization.id,
        project_id: estimateData.projectId,
        name: estimateData.name,
        status: estimateData.status,
        total_amount: estimateData.totalAmount,
        total_estimated_hours: estimateData.totalEstimatedHours,
        created_by: user.id,
      })
      .select()
      .single();

    if (estimateError) throw estimateError;

    // Insert estimate items
    const itemsToInsert = estimateData.items.map(item => ({
      organization_id: organization.id,
      estimate_id: estimateRecord.id,
      item_type: item.type,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unitCost,
      total_cost: item.totalCost,
      estimated_hours: item.estimatedHours,
    }));

    const { error: itemsError } = await supabase
      .from('estimate_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
    await fetchData();
  }, [organization, user, fetchData]);

  // Update estimate status
  const updateEstimateStatus = useCallback(async (id: number, status: 'Draft' | 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('estimates')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  // Add expense
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
    if (!organization?.id || !user?.id) return;

    const { error } = await supabase
      .from('expenses')
      .insert({
        organization_id: organization.id,
        project_id: expenseData.projectId,
        description: expenseData.description,
        amount: expenseData.amount,
        expense_date: expenseData.date.toISOString().split('T')[0],
        category: expenseData.category,
        receipt_url: expenseData.receiptUrl,
        created_by: user.id,
      });

    if (error) throw error;
    await fetchData();
  }, [organization, user, fetchData]);

  // Delete expense
  const deleteExpense = useCallback(async (id: number) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const value = useMemo(() => ({ 
    users, projects, tasks, timeLogs, inventory, orderList, estimates, expenses, currentUser, loading,
    setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus, 
    toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto, 
    addInventoryItem, updateInventoryItemQuantity, updateInventoryItem, addToOrderList, 
    addManualItemToOrderList, removeFromOrderList, clearOrderList,
    addEstimate, updateEstimateStatus, addExpense, deleteExpense, refreshData: fetchData
  }), [
    users, projects, tasks, timeLogs, inventory, orderList, estimates, expenses, currentUser, loading,
    addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
    switchJob, addPunchListItem, togglePunchListItem, addPhoto, addInventoryItem,
    updateInventoryItemQuantity, updateInventoryItem, addToOrderList, addManualItemToOrderList,
    removeFromOrderList, clearOrderList, addEstimate, updateEstimateStatus, addExpense, deleteExpense, fetchData
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { 
    throw new Error('useData must be used within a SupabaseDataProvider'); 
  }
  return context;
};
