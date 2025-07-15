export type UserRole = 'L1' | 'L2' | 'L3' | 'Admin';

export type InvoiceStatus = 'Draft' | 'Pending L2' | 'Pending L3' | 'Approved' | 'Rejected' | 'Dispatched';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Account {
  id: string;
  name: string;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  accountId: string;
  resources: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  rate: number;
  weekendRate: number;
  otRate: number;
  projectId: string;
}

export interface Invoice {
  id: string;
  project: string;
  projectId: string;
  client: string;
  status: InvoiceStatus;
  amount: number;
  month: string;
  year: number;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  pdfUrl?: string;
  history: InvoiceHistoryEntry[];
}

export interface InvoiceHistoryEntry {
  id: string;
  action: string;
  by: string;
  byId: string;
  date: string;
  comment?: string;
}

export interface DashboardStats {
  totalInvoices: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
}