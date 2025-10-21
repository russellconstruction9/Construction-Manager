
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

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: number;
  name: string;
  role: string;
  avatarUrl: string;
  isClockedIn: boolean;
  hourlyRate: number;
  clockInTime?: Date;
  currentProjectId?: number;
}

export interface PunchListItem {
  id: number;
  text: string;
  isComplete: boolean;
}

export interface ProjectPhoto {
  id: number;
  imageDataUrl?: string; // Stored in IndexedDB, not with project object
  description: string;
  dateAdded: Date;
}

export interface Project {
  id: number;
  name: string;
  address: string;
  type: ProjectType;
  status: 'In Progress' | 'Completed' | 'On Hold';
  startDate: Date;
  endDate: Date;
  budget: number;
  currentSpend: number;
  punchList: PunchListItem[];
  photos: ProjectPhoto[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number;
  assigneeId: number;
  dueDate: Date;
  status: TaskStatus;
}

export interface TimeLog {
  id: number;
  userId: number;
  projectId: number;
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
  id: number;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold?: number;
}

export interface InventoryOrderItem {
  type: 'inventory';
  itemId: number;
}

export interface ManualOrderItem {
  type: 'manual';
  id: number;
  name: string;
}

export type OrderListItem = InventoryOrderItem | ManualOrderItem;

export interface Chat {
  sender: 'user' | 'model';
  message: string;
  image?: string; // base64 encoded image
  toolResponse?: any;
}