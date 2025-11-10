import { supabase } from './supabaseClient';
import { Database, Tables } from '../supabase-types';
import { User, Project, Task, TimeLog, InventoryItem, ProjectPhoto, TaskStatus, ProjectType } from '../types';

// Type aliases for better readability
type DBUser = Tables<'users'>;
type DBProject = Tables<'projects'>;
type DBTask = Tables<'tasks'>;
type DBTimeLog = Tables<'time_logs'>;
type DBInventory = Tables<'inventory'>;
type DBProjectPhoto = Tables<'project_photos'>;

// Helper functions to convert between app types and database types
const dbUserToAppUser = (dbUser: DBUser): User => ({
  id: parseInt(dbUser.id.slice(-8), 16), // Convert UUID to number for compatibility
  name: dbUser.name,
  role: dbUser.role || 'worker',
  hourlyRate: Number(dbUser.hourly_rate) || 25,
  avatarUrl: dbUser.avatar_url || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
  isClockedIn: dbUser.is_clocked_in || false,
  email: dbUser.email || undefined,
  phone: dbUser.phone || undefined,
});

const appUserToDbUser = (user: Omit<User, 'id'>): Database['public']['Tables']['users']['Insert'] => ({
  name: user.name,
  role: user.role,
  hourly_rate: user.hourlyRate,
  avatar_url: user.avatarUrl,
  is_clocked_in: user.isClockedIn,
  email: user.email,
  phone: user.phone,
});

const dbProjectToAppProject = (dbProject: DBProject): Project => ({
  id: parseInt(dbProject.id.slice(-8), 16),
  name: dbProject.name,
  address: dbProject.address || '',
  type: (dbProject.description?.includes('Renovation') ? ProjectType.Renovation :
         dbProject.description?.includes('New') ? ProjectType.NewConstruction :
         dbProject.description?.includes('Interior') ? ProjectType.InteriorFitOut :
         dbProject.description?.includes('Demolition') ? ProjectType.Demolition :
         ProjectType.NewConstruction) as ProjectType,
  status: (dbProject.status || 'Planning') as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
  startDate: dbProject.start_date ? new Date(dbProject.start_date) : new Date(),
  endDate: dbProject.end_date ? new Date(dbProject.end_date) : new Date(),
  budget: Number(dbProject.budget) || 0,
  punchList: [], // Will be loaded separately if needed
  photos: [], // Will be loaded separately
  progressPercentage: dbProject.progress_percentage || 0,
  clientName: dbProject.client_name || undefined,
  clientEmail: dbProject.client_email || undefined,
  clientPhone: dbProject.client_phone || undefined,
  description: dbProject.description || undefined,
});

const appProjectToDbProject = (project: Omit<Project, 'id' | 'punchList' | 'photos'>): Database['public']['Tables']['projects']['Insert'] => ({
  name: project.name,
  address: project.address,
  description: `${project.type} project${project.description ? ': ' + project.description : ''}`,
  status: project.status,
  start_date: project.startDate.toISOString().split('T')[0],
  end_date: project.endDate.toISOString().split('T')[0],
  budget: project.budget,
  progress_percentage: project.progressPercentage || 0,
  client_name: project.clientName,
  client_email: project.clientEmail,
  client_phone: project.clientPhone,
});

const dbTaskToAppTask = (dbTask: DBTask): Task => ({
  id: parseInt(dbTask.id.slice(-8), 16),
  title: dbTask.title,
  description: dbTask.description || '',
  status: (dbTask.status || 'To Do') as TaskStatus,
  priority: dbTask.priority || 'Medium',
  projectId: dbTask.project_id ? parseInt(dbTask.project_id.slice(-8), 16) : undefined,
  assignedTo: dbTask.assigned_to ? parseInt(dbTask.assigned_to.slice(-8), 16) : undefined,
  dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
  estimatedHours: Number(dbTask.estimated_hours) || undefined,
  actualHours: Number(dbTask.actual_hours) || 0,
});

const dbTimeLogToAppTimeLog = (dbLog: DBTimeLog): TimeLog => ({
  id: parseInt(dbLog.id.slice(-8), 16),
  userId: parseInt(dbLog.user_id.slice(-8), 16),
  projectId: dbLog.project_id ? parseInt(dbLog.project_id.slice(-8), 16) : undefined,
  clockIn: new Date(dbLog.clock_in),
  clockOut: dbLog.clock_out ? new Date(dbLog.clock_out) : undefined,
  durationMs: Number(dbLog.duration_ms) || undefined,
  cost: Number(dbLog.cost) || undefined,
  notes: dbLog.notes || undefined,
});

// User operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(dbUserToAppUser);
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(appUserToDbUser(user))
      .select()
      .single();
    
    if (error) throw error;
    return dbUserToAppUser(data);
  },

  async update(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User> {
    // Find user by converted ID
    const { data: users } = await supabase
      .from('users')
      .select('*');
    
    const user = users?.find(u => parseInt(u.id.slice(-8), 16) === id);
    if (!user) throw new Error(`User with id ${id} not found`);

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates.name && { name: updates.name },
        ...updates.role && { role: updates.role },
        ...updates.hourlyRate && { hourly_rate: updates.hourlyRate },
        ...updates.avatarUrl && { avatar_url: updates.avatarUrl },
        ...updates.isClockedIn !== undefined && { is_clocked_in: updates.isClockedIn },
        ...updates.email && { email: updates.email },
        ...updates.phone && { phone: updates.phone },
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return dbUserToAppUser(data);
  },
};

// Project operations
export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(dbProjectToAppProject);
  },

  async create(project: Omit<Project, 'id' | 'punchList' | 'photos'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(appProjectToDbProject(project))
      .select()
      .single();
    
    if (error) throw error;
    return dbProjectToAppProject(data);
  },

  async update(id: number, updates: Partial<Project>): Promise<Project> {
    const { data: projects } = await supabase
      .from('projects')
      .select('*');
    
    const project = projects?.find(p => parseInt(p.id.slice(-8), 16) === id);
    if (!project) throw new Error(`Project with id ${id} not found`);

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates.name && { name: updates.name },
        ...updates.address && { address: updates.address },
        ...updates.status && { status: updates.status },
        ...updates.startDate && { start_date: updates.startDate.toISOString().split('T')[0] },
        ...updates.endDate && { end_date: updates.endDate.toISOString().split('T')[0] },
        ...updates.budget && { budget: updates.budget },
        ...updates.progressPercentage !== undefined && { progress_percentage: updates.progressPercentage },
        ...updates.clientName && { client_name: updates.clientName },
        ...updates.clientEmail && { client_email: updates.clientEmail },
        ...updates.clientPhone && { client_phone: updates.clientPhone },
        ...updates.description && { description: updates.description },
      })
      .eq('id', project.id)
      .select()
      .single();
    
    if (error) throw error;
    return dbProjectToAppProject(data);
  },
};

// Task operations
export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(dbTaskToAppTask);
  },

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    // Convert app IDs to UUIDs
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: users } = await supabase.from('users').select('*');
    
    const project = task.projectId ? projects?.find(p => parseInt(p.id.slice(-8), 16) === task.projectId) : null;
    const user = task.assignedTo ? users?.find(u => parseInt(u.id.slice(-8), 16) === task.assignedTo) : null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        project_id: project?.id || null,
        assigned_to: user?.id || null,
        due_date: task.dueDate?.toISOString().split('T')[0] || null,
        estimated_hours: task.estimatedHours || null,
        actual_hours: task.actualHours || 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return dbTaskToAppTask(data);
  },

  async update(id: number, updates: Partial<Task>): Promise<Task> {
    const { data: tasks } = await supabase.from('tasks').select('*');
    const task = tasks?.find(t => parseInt(t.id.slice(-8), 16) === id);
    if (!task) throw new Error(`Task with id ${id} not found`);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates.title && { title: updates.title },
        ...updates.description && { description: updates.description },
        ...updates.status && { status: updates.status },
        ...updates.priority && { priority: updates.priority },
        ...updates.dueDate && { due_date: updates.dueDate.toISOString().split('T')[0] },
        ...updates.estimatedHours && { estimated_hours: updates.estimatedHours },
        ...updates.actualHours !== undefined && { actual_hours: updates.actualHours },
      })
      .eq('id', task.id)
      .select()
      .single();
    
    if (error) throw error;
    return dbTaskToAppTask(data);
  },
};

// Time log operations
export const timeLogService = {
  async getAll(): Promise<TimeLog[]> {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('clock_in', { ascending: false });
    
    if (error) throw error;
    return data.map(dbTimeLogToAppTimeLog);
  },

  async create(timeLog: Omit<TimeLog, 'id'>): Promise<TimeLog> {
    // Convert app IDs to UUIDs
    const { data: users } = await supabase.from('users').select('*');
    const { data: projects } = await supabase.from('projects').select('*');
    
    const user = users?.find(u => parseInt(u.id.slice(-8), 16) === timeLog.userId);
    const project = timeLog.projectId ? projects?.find(p => parseInt(p.id.slice(-8), 16) === timeLog.projectId) : null;
    
    if (!user) throw new Error(`User with id ${timeLog.userId} not found`);

    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: user.id,
        project_id: project?.id || null,
        clock_in: timeLog.clockIn.toISOString(),
        clock_out: timeLog.clockOut?.toISOString() || null,
        duration_ms: timeLog.durationMs || null,
        cost: timeLog.cost || null,
        notes: timeLog.notes || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return dbTimeLogToAppTimeLog(data);
  },

  async update(id: number, updates: Partial<TimeLog>): Promise<TimeLog> {
    const { data: timeLogs } = await supabase.from('time_logs').select('*');
    const timeLog = timeLogs?.find(t => parseInt(t.id.slice(-8), 16) === id);
    if (!timeLog) throw new Error(`Time log with id ${id} not found`);

    const { data, error } = await supabase
      .from('time_logs')
      .update({
        ...updates.clockOut && { clock_out: updates.clockOut.toISOString() },
        ...updates.durationMs !== undefined && { duration_ms: updates.durationMs },
        ...updates.cost !== undefined && { cost: updates.cost },
        ...updates.notes && { notes: updates.notes },
      })
      .eq('id', timeLog.id)
      .select()
      .single();
    
    if (error) throw error;
    return dbTimeLogToAppTimeLog(data);
  },
};

// Inventory operations
export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(item => ({
      id: parseInt(item.id.slice(-8), 16),
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit || 'piece',
      costPerUnit: Number(item.cost_per_unit) || 0,
      supplier: item.supplier || '',
      category: item.category || '',
      location: item.location || '',
      minQuantity: item.min_quantity || 0,
    }));
  },

  async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        cost_per_unit: item.costPerUnit,
        supplier: item.supplier,
        category: item.category,
        location: item.location,
        min_quantity: item.minQuantity,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: parseInt(data.id.slice(-8), 16),
      name: data.name,
      description: data.description || '',
      quantity: data.quantity,
      unit: data.unit || 'piece',
      costPerUnit: Number(data.cost_per_unit) || 0,
      supplier: data.supplier || '',
      category: data.category || '',
      location: data.location || '',
      minQuantity: data.min_quantity || 0,
    };
  },

  async update(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data: inventory } = await supabase.from('inventory').select('*');
    const item = inventory?.find(i => parseInt(i.id.slice(-8), 16) === id);
    if (!item) throw new Error(`Inventory item with id ${id} not found`);

    const { data, error } = await supabase
      .from('inventory')
      .update({
        ...updates.name && { name: updates.name },
        ...updates.description && { description: updates.description },
        ...updates.quantity !== undefined && { quantity: updates.quantity },
        ...updates.unit && { unit: updates.unit },
        ...updates.costPerUnit !== undefined && { cost_per_unit: updates.costPerUnit },
        ...updates.supplier && { supplier: updates.supplier },
        ...updates.category && { category: updates.category },
        ...updates.location && { location: updates.location },
        ...updates.minQuantity !== undefined && { min_quantity: updates.minQuantity },
      })
      .eq('id', item.id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: parseInt(data.id.slice(-8), 16),
      name: data.name,
      description: data.description || '',
      quantity: data.quantity,
      unit: data.unit || 'piece',
      costPerUnit: Number(data.cost_per_unit) || 0,
      supplier: data.supplier || '',
      category: data.category || '',
      location: data.location || '',
      minQuantity: data.min_quantity || 0,
    };
  },
};

// Data migration utilities
export const migrationService = {
  async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('Starting data migration from localStorage to Supabase...');

      // Migrate users
      const localUsers = JSON.parse(localStorage.getItem('scc_users') || '[]');
      if (localUsers.length > 0) {
        console.log(`Migrating ${localUsers.length} users...`);
        for (const user of localUsers) {
          try {
            await userService.create(user);
          } catch (error) {
            console.warn(`Failed to migrate user ${user.name}:`, error);
          }
        }
      }

      // Migrate projects
      const localProjects = JSON.parse(localStorage.getItem('scc_projects') || '[]', (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      if (localProjects.length > 0) {
        console.log(`Migrating ${localProjects.length} projects...`);
        for (const project of localProjects) {
          try {
            await projectService.create(project);
          } catch (error) {
            console.warn(`Failed to migrate project ${project.name}:`, error);
          }
        }
      }

      // Migrate tasks
      const localTasks = JSON.parse(localStorage.getItem('scc_tasks') || '[]', (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      if (localTasks.length > 0) {
        console.log(`Migrating ${localTasks.length} tasks...`);
        for (const task of localTasks) {
          try {
            await taskService.create(task);
          } catch (error) {
            console.warn(`Failed to migrate task ${task.title}:`, error);
          }
        }
      }

      // Migrate inventory
      const localInventory = JSON.parse(localStorage.getItem('scc_inventory') || '[]');
      if (localInventory.length > 0) {
        console.log(`Migrating ${localInventory.length} inventory items...`);
        for (const item of localInventory) {
          try {
            await inventoryService.create(item);
          } catch (error) {
            console.warn(`Failed to migrate inventory item ${item.name}:`, error);
          }
        }
      }

      console.log('Data migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async clearLocalStorage(): Promise<void> {
    const keys = ['scc_users', 'scc_projects', 'scc_tasks', 'scc_timeLogs', 'scc_inventory', 'scc_currentUser'];
    keys.forEach(key => localStorage.removeItem(key));
    console.log('Local storage cleared');
  }
};