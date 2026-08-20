export type UserRole = 'ADMIN' | 'SALES' | 'DEVELOPER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  _count?: {
    assignedTasks?: number;
    assignedRequests?: number;
  };
}

export interface CompanyContact {
  id: string;
  companyId: string;
  name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary: boolean;
  createdAt?: string;
}

export interface Company {
  id: string;
  companyName: string;
  status: string;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  currentSoftware?: string | null;
  eInvoiceStatus?: string | null;
  eLedgerStatus?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  contacts?: CompanyContact[];
  tasks?: Task[];
  customerRequests?: CustomerRequest[];
  notes?: Note[];
  activities?: Activity[];
  _count?: {
    tasks: number;
    customerRequests: number;
    contacts: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  companyId: string;
  status: string;
  priority: string;
  assignedUserId?: string | null;
  createdById: string;
  startDate?: string | null;
  dueDate?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  assignedUser?: User | null;
  creator?: User;
  notes?: Note[];
  activities?: Activity[];
  _count?: {
    notes: number;
    activities: number;
  };
}

export interface CustomerRequest {
  id: string;
  title: string;
  description: string;
  requestedBy?: string | null;
  companyId: string;
  priority: string;
  status: string;
  assignedUserId?: string | null;
  createdById: string;
  solution?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  assignedUser?: User | null;
  creator?: User;
  notes?: Note[];
  activities?: Activity[];
  _count?: {
    notes: number;
    activities: number;
  };
}

export interface Activity {
  id: string;
  userId: string;
  companyId?: string | null;
  taskId?: string | null;
  requestId?: string | null;
  action: string;
  description: string;
  createdAt: string;
  user?: User;
  company?: { id: string; companyName: string };
  task?: { id: string; title: string };
  request?: { id: string; title: string };
}

export interface Note {
  id: string;
  content: string;
  createdById: string;
  companyId?: string | null;
  taskId?: string | null;
  requestId?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

export interface CustomStatus {
  id: string;
  name: string;
  category: 'COMPANY' | 'TASK' | 'REQUEST';
  color?: string | null;
  order: number;
  isActive: boolean;
}

export interface CustomPriority {
  id: string;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
