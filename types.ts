import { GoogleGenAI, GenerateContentResponse, Chat as GeminiChat, FunctionDeclaration, Type } from '@google/genai';


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
  photo?: {
    baseImageId: string; // Unique ID for the original image in IndexedDB
    annotatedImageUrl: string; // Data URL for the marked-up image to display
  };
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
  notes?: string;
  invoiceId?: number;
}

export interface Chat {
  sender: 'user' | 'model';
  message: string;
  image?: string; // base64 encoded image
  toolResponse?: any;
}

// FIX: Added InventoryItem interface to resolve type errors in inventory components.
export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  lowStockThreshold?: number;
}

// FIX: Added Invoice-related types to resolve type errors in invoicing components.
export enum InvoiceStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Paid = 'Paid',
  Overdue = 'Overdue',
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  timeLogIds?: number[];
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  projectId: number;
  dateIssued: Date;
  dueDate: Date;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  notes?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}