// Enhanced Invoice Types with Object-Driven Approach

export type InvoiceTemplate = 'standard' | 'time-material' | 'fixed-bid' | 'mixed-hybrid';

export type InvoiceSectionType = 
  | 'standardHours' 
  | 'overtimeHours' 
  | 'weeklyWorkingHours'
  | 'productionSupport' 
  | 'services' 
  | 'licenses';

export interface InvoiceSection {
  id: string;
  type: InvoiceSectionType;
  name: string;
  enabled: boolean;
  required: boolean;
  order: number;
  headers: string[];
  data: InvoiceSectionData[];
  total: number;
  editable: boolean;
}

export interface InvoiceSectionData {
  id: string;
  [key: string]: any; // Dynamic fields based on section type
}

// Standard Hours Section Data
export interface StandardHoursData extends InvoiceSectionData {
  name: string;
  project: string;
  role: string;
  rate: number;
  hoursWorked: number;
  amount: number;
}

// Overtime Hours Section Data
export interface OvertimeHoursData extends InvoiceSectionData {
  name: string;
  project: string;
  role: string;
  rate: number;
  hoursWorked: number;
  amount: number;
}

// Weekly Working Hours Section Data
export interface WeeklyWorkingHoursData extends InvoiceSectionData {
  name: string;
  project: string;
  hoursWorked: number;
  amount: number;
}

// Production Support Section Data
export interface ProductionSupportData extends InvoiceSectionData {
  name: string;
  project: string;
  hoursWorked: number;
  amount: number;
}

// Services Section Data
export interface ServicesData extends InvoiceSectionData {
  service: string;
  cost: number;
}

// Licenses Section Data
export interface LicensesData extends InvoiceSectionData {
  licenseName: string;
  cost: number;
}

export interface InvoiceComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: string;
  status: 'pending' | 'resolved';
  type: 'question' | 'clarification' | 'correction';
}

export interface InvoiceConfiguration {
  id: string;
  projectId: string;
  accountId: string;
  template: InvoiceTemplate;
  month: string;
  year: number;
  sections: InvoiceSection[];
  clientInfo: {
    name: string;
    address: string;
    email: string;
  };
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  comments: InvoiceComment[];
  status: 'draft' | 'pending-approval' | 'approved' | 'generated';
  metadata: {
    createdBy: string;
    createdAt: string;
    lastModifiedBy: string;
    lastModifiedAt: string;
    autoSaveEnabled: boolean;
    lastAutoSave?: string;
  };
}

export interface InvoiceGenerationRequest {
  configuration: InvoiceConfiguration;
  format: 'pdf' | 'excel';
  includeAttachments: boolean;
}

export interface InvoiceGenerationResponse {
  success: boolean;
  invoiceId: string;
  previewUrl: string;
  downloadUrl: string;
  errors?: string[];
}

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }[];
}

export interface InvoiceTemplateConfig {
  id: InvoiceTemplate;
  name: string;
  description: string;
  defaultSections: InvoiceSectionType[];
  requiredSections: InvoiceSectionType[];
  customizable: boolean;
  icon: string;
}

export interface ProjectInvoiceData {
  projectId: string;
  accountId: string;
  projectName: string;
  accountName: string;
  resources: Resource[];
  standardHours: StandardHoursData[];
  overtimeHours: OvertimeHoursData[];
  weeklyWorkingHours: WeeklyWorkingHoursData[];
  productionSupport: ProductionSupportData[];
  services: ServicesData[];
  licenses: LicensesData[];
  period: {
    month: string;
    year: number;
  };
}

export interface InvoicePreview {
  configuration: InvoiceConfiguration;
  previewHtml: string;
  estimatedPages: number;
  warnings: string[];
}

// Re-export from main types for compatibility
export type { Resource } from '../types';