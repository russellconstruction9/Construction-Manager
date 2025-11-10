// @ts-nocheck
import { supabase } from './supabaseClient';
import { Database } from '../supabase-types';
import { User, Project, Task, TimeLog, InventoryItem, TaskStatus, ProjectType } from '../types';

/**
 * IMPORTANT: This service layer uses app_id columns for compatibility with the existing app
 * The database uses UUIDs as primary keys, but we add app_id (SERIAL) columns for app compatibility
 */

// User operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    if (!data) return [];
    
    return (data as any[]).map((user: any) => ({
      id: user.app_id,
      name: user.name,
      role: user.role || 'worker',
      hourlyRate: Number(user.hourly_rate) || 25,
      avatarUrl: user.avatar_url || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
      isClockedIn: user.is_clocked_in || false,
      email: user.email || undefined,
      phone: user.phone || undefined,
    }));
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        role: user.role,
        hourly_rate: user.hourlyRate,
        avatar_url: user.avatarUrl,
        is_clocked_in: user.isClockedIn,
        email: user.email,
        phone: user.phone,
      } as any)
      .select('*')
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    const userData = data as any;
    return {
      id: userData.app_id,
      name: userData.name,
      role: userData.role || 'worker',
      hourlyRate: Number(userData.hourly_rate) || 25,
      avatarUrl: userData.avatar_url || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
      isClockedIn: userData.is_clocked_in || false,
      email: userData.email || undefined,
      phone: userData.phone || undefined,
    };
  },

  async update(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.isClockedIn !== undefined) updateData.is_clocked_in = updates.isClockedIn;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;

    const { data, error } = await supabase
      .from('users')
      .update(updateData as any)
      .eq('app_id' as any, id)
      .select('*')
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    const userData = data as any;
    return {
      id: userData.app_id,
      name: userData.name,
      role: userData.role || 'worker',
      hourlyRate: Number(userData.hourly_rate) || 25,
      avatarUrl: userData.avatar_url || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
      isClockedIn: userData.is_clocked_in || false,
      email: userData.email || undefined,
      phone: userData.phone || undefined,
    };
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
    
    return data.map(project => ({
      id: project.app_id,
      name: project.name,
      address: project.address || '',
      type: (project.description?.includes('Renovation') ? ProjectType.Renovation :
             project.description?.includes('New') ? ProjectType.NewConstruction :
             project.description?.includes('Interior') ? ProjectType.InteriorFitOut :
             project.description?.includes('Demolition') ? ProjectType.Demolition :
             ProjectType.NewConstruction) as ProjectType,
      status: (project.status || 'Planning') as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      budget: Number(project.budget) || 0,
      punchList: [],
      photos: [],
      progressPercentage: project.progress_percentage || 0,
      clientName: project.client_name || undefined,
      clientEmail: project.client_email || undefined,
      clientPhone: project.client_phone || undefined,
      description: project.description || undefined,
    }));
  },

  async create(project: Omit<Project, 'id' | 'punchList' | 'photos'>): Promise<Project> {
    const { data, error} = await supabase
      .from('projects')
      .insert({
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
      })
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
      name: data.name,
      address: data.address || '',
      type: project.type,
      status: (data.status || 'Planning') as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
      startDate: data.start_date ? new Date(data.start_date) : new Date(),
      endDate: data.end_date ? new Date(data.end_date) : new Date(),
      budget: Number(data.budget) || 0,
      punchList: [],
      photos: [],
      progressPercentage: data.progress_percentage || 0,
      clientName: data.client_name || undefined,
      clientEmail: data.client_email || undefined,
      clientPhone: data.client_phone || undefined,
      description: data.description || undefined,
    };
  },

  async update(id: number, updates: Partial<Project>): Promise<Project> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0];
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString().split('T')[0];
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.progressPercentage !== undefined) updateData.progress_percentage = updates.progressPercentage;
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
    if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
    if (updates.description !== undefined) updateData.description = updates.description;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('app_id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
      name: data.name,
      address: data.address || '',
      type: updates.type || ProjectType.NewConstruction,
      status: (data.status || 'Planning') as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
      startDate: data.start_date ? new Date(data.start_date) : new Date(),
      endDate: data.end_date ? new Date(data.end_date) : new Date(),
      budget: Number(data.budget) || 0,
      punchList: [],
      photos: [],
      progressPercentage: data.progress_percentage || 0,
      clientName: data.client_name || undefined,
      clientEmail: data.client_email || undefined,
      clientPhone: data.client_phone || undefined,
      description: data.description || undefined,
    };
  },
};

// Task operations
export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects:project_id(app_id),
        users:assigned_to(app_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(task => ({
      id: task.app_id,
      title: task.title,
      description: task.description || '',
      status: (task.status || 'To Do') as TaskStatus,
      priority: task.priority || 'Medium',
      projectId: task.projects ? (task.projects as any).app_id : undefined,
      assignedTo: task.users ? (task.users as any).app_id : undefined,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      estimatedHours: Number(task.estimated_hours) || undefined,
      actualHours: Number(task.actual_hours) || 0,
    }));
  },

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    // Get UUID for project_id and assigned_to if they exist
    let projectUuid = null;
    let userUuid = null;

    if (task.projectId) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('app_id', task.projectId)
        .single();
      projectUuid = projectData?.id;
    }

    if (task.assignedTo) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('app_id', task.assignedTo)
        .single();
      userUuid = userData?.id;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        project_id: projectUuid,
        assigned_to: userUuid,
        due_date: task.dueDate?.toISOString().split('T')[0] || null,
        estimated_hours: task.estimatedHours || null,
        actual_hours: task.actualHours || 0,
      })
      .select(`
        *,
        projects:project_id(app_id),
        users:assigned_to(app_id)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
      title: data.title,
      description: data.description || '',
      status: (data.status || 'To Do') as TaskStatus,
      priority: data.priority || 'Medium',
      projectId: data.projects ? (data.projects as any).app_id : undefined,
      assignedTo: data.users ? (data.users as any).app_id : undefined,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      estimatedHours: Number(data.estimated_hours) || undefined,
      actualHours: Number(data.actual_hours) || 0,
    };
  },

  async update(id: number, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString().split('T')[0];
    if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
    if (updates.actualHours !== undefined) updateData.actual_hours = updates.actualHours;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('app_id', id)
      .select(`
        *,
        projects:project_id(app_id),
        users:assigned_to(app_id)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
      title: data.title,
      description: data.description || '',
      status: (data.status || 'To Do') as TaskStatus,
      priority: data.priority || 'Medium',
      projectId: data.projects ? (data.projects as any).app_id : undefined,
      assignedTo: data.users ? (data.users as any).app_id : undefined,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      estimatedHours: Number(data.estimated_hours) || undefined,
      actualHours: Number(data.actual_hours) || 0,
    };
  },
};

// Time log operations
export const timeLogService = {
  async getAll(): Promise<TimeLog[]> {
    const { data, error } = await supabase
      .from('time_logs')
      .select(`
        *,
        users:user_id(app_id),
        projects:project_id(app_id)
      `)
      .order('clock_in', { ascending: false });
    
    if (error) throw error;
    
    return data.map(log => ({
      id: log.app_id,
      userId: log.users ? (log.users as any).app_id : 0,
      projectId: log.projects ? (log.projects as any).app_id : undefined,
      clockIn: new Date(log.clock_in),
      clockOut: log.clock_out ? new Date(log.clock_out) : undefined,
      durationMs: Number(log.duration_ms) || undefined,
      cost: Number(log.cost) || undefined,
      notes: log.notes || undefined,
    }));
  },

  async create(timeLog: Omit<TimeLog, 'id'>): Promise<TimeLog> {
    // Get UUIDs
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('app_id', timeLog.userId)
      .single();
    
    let projectUuid = null;
    if (timeLog.projectId) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('app_id', timeLog.projectId)
        .single();
      projectUuid = projectData?.id;
    }

    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: userData!.id,
        project_id: projectUuid,
        clock_in: timeLog.clockIn.toISOString(),
        clock_out: timeLog.clockOut?.toISOString() || null,
        duration_ms: timeLog.durationMs || null,
        cost: timeLog.cost || null,
        notes: timeLog.notes || null,
      })
      .select(`
        *,
        users:user_id(app_id),
        projects:project_id(app_id)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
      userId: data.users ? (data.users as any).app_id : 0,
      projectId: data.projects ? (data.projects as any).app_id : undefined,
      clockIn: new Date(data.clock_in),
      clockOut: data.clock_out ? new Date(data.clock_out) : undefined,
      durationMs: Number(data.duration_ms) || undefined,
      cost: Number(data.cost) || undefined,
      notes: data.notes || undefined,
    };
  },

  async update(id: number, updates: Partial<TimeLog>): Promise<TimeLog> {
    const updateData: any = {};
    if (updates.clockOut !== undefined) updateData.clock_out = updates.clockOut.toISOString();
    if (updates.durationMs !== undefined) updateData.duration_ms = updates.durationMs;
    if (updates.cost !== undefined) updateData.cost = updates.cost;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('time_logs')
      .update(updateData)
      .eq('app_id', id)
      .select(`
        *,
        users:user_id(app_id),
        projects:project_id(app_id)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
      userId: data.users ? (data.users as any).app_id : 0,
      projectId: data.projects ? (data.projects as any).app_id : undefined,
      clockIn: new Date(data.clock_in),
      clockOut: data.clock_out ? new Date(data.clock_out) : undefined,
      durationMs: Number(data.duration_ms) || undefined,
      cost: Number(data.cost) || undefined,
      notes: data.notes || undefined,
    };
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
      id: item.app_id,
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
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
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
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.costPerUnit !== undefined) updateData.cost_per_unit = updates.costPerUnit;
    if (updates.supplier !== undefined) updateData.supplier = updates.supplier;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.minQuantity !== undefined) updateData.min_quantity = updates.minQuantity;

    const { data, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('app_id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      id: data.app_id,
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

