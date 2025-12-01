
export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum ProjectType {
  NewConstruction = "New Construction",
  Renovation = "Renovation",
  Demolition = "Demolition",
  InteriorFitOut = "Interior Fit-Out",
}

export type UserRole = 'Admin' | 'Employee';

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: string | number; // UUID from Supabase or legacy number ID
  name: string;
  role: string; // Job Title
  roleType: UserRole; // Permission Level
  avatarUrl: string;
  isClockedIn: boolean;
  hourlyRate: number;
  clockInTime?: Date;
  currentProjectId?: string | number;
}

export interface PunchListItem {
  id: string | number;
  text: string;
  isComplete: boolean;
}

export interface ProjectPhoto {
  id: string | number;
  imageDataUrl?: string; // URL from Supabase Storage or legacy data URL
  description: string;
  dateAdded: Date;
}

export interface Project {
  id: string | number;
  name: string;
  address: string;
  type: ProjectType;
  status: 'In Progress' | 'Completed' | 'On Hold';
  startDate: Date;
  endDate: Date;
  budget: number;
  currentSpend: number; // Deprecated in favor of calculated actuals from Job Costing
  punchList: PunchListItem[];
  photos: ProjectPhoto[];
}

export interface Task {
  id: string | number;
  title: string;
  description: string;
  projectId: string | number;
  assigneeId: string | number;
  dueDate: Date;
  status: TaskStatus;
}

export interface TimeLog {
  id: string | number;
  userId: string | number;
  projectId: string | number;
  clockIn: Date;
  clockOut?: Date;
  durationMs?: number;
  cost?: number;
  clockInLocation?: Location;
  clockOutLocation?: Location;
  clockInMapImage?: string;
  clockOutMapImage?: string;
}

export interface InventoryItem {
  id: string | number;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold?: number;
}

export interface InventoryOrderItem {
  type: 'inventory';
  itemId: string | number;
}

export interface ManualOrderItem {
  type: 'manual';
  id: string | number;
  name: string;
}

export type OrderListItem = InventoryOrderItem | ManualOrderItem;

export interface Chat {
  sender: 'user' | 'model';
  message: string;
  image?: string; // base64 encoded image
  toolResponse?: any;
}

// --- NEW ESTIMATING & JOB COSTING TYPES ---

export type EstimateItemType = 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other';

export interface EstimateItem {
    id?: string | number;
    type: EstimateItemType;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    estimatedHours?: number; // Only for Labor
}

export interface Estimate {
    id: string | number;
    projectId: string | number;
    name: string;
    dateCreated?: Date;
    status: 'Draft' | 'Approved' | 'Rejected';
    items: EstimateItem[];
    totalAmount: number;
    totalEstimatedHours: number;
}

export interface Expense {
    id: string | number;
    projectId: string | number;
    description: string;
    amount: number;
    date: Date;
    category: EstimateItemType;
    receiptUrl?: string; // Optional future feature
}
