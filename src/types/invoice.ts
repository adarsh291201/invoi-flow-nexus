// Enhanced Invoice Types with 7-Template System
import { Resource } from '../types/index';

export type InvoiceTemplate = 'template1' | 'template2' | 'template3' | 'template4' | 'template5' | 'template6' | 'template7';

// Template-specific data interfaces
export interface Template1Data {
  id: string;
  sNo: number;
  name: string;
  project: string;
  role: string;
  rate: number;
  hrsWorked: number;
  amount: number;
}

export interface Template2Data {
  id: string;
  sNo: number;
  name: string;
  role: string;
  rate: number;
  hrsWorked: number;
  amount: number;
}

export interface Template3Data {
  id: string;
  sNo: number;
  description: string;
  amount: number;
}

export interface Template4Data {
  id: string;
  sNo: number;
  services: string;
  cost: number;
}

export interface Template5Data {
  id: string;
  sNo: number;
  description: string;
  project: string;
  unit: string;
  amount: number;
}

export interface Template6Data {
  id: string;
  sNo: number;
  name: string;
  role: string;
  rate: number;
  hrsWorked: number;
  amount: number;
}

export interface Template7MainData {
  id: string;
  sNo: number;
  name: string;
  role: string;
  rate: number;
  hrsWorked: number;
  amount: number;
}

export interface Template7ProductionSupportData {
  id: string;
  sNo: number;
  name: string;
  role: string;
  rate: number;
  hrsWorked: number;
  amount: number;
}

// Template 6 additional fields
export interface Template6Additional {
  futureAccountCreditCurrentMonth: number;
  futureAccountCreditPreviousMonth: number;
  futureAccountCreditEndOfMonth: number;
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

// Common invoice data for all templates
export interface InvoiceCommonData {
  companyName: string;
  companyAddress: string;
  billTo: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentTerms: string;
  phoneNumber: string;
  billingPeriod: string;
}

export interface InvoiceConfiguration {
  id: string;
  projectId: string;
  accountId: string;
  template: InvoiceTemplate;
  month: string;
  year: number;
  commonData: InvoiceCommonData;
  templateData: {
    template1?: Template1Data[];
    template2?: Template2Data[];
    template3?: Template3Data[];
    template4?: Template4Data[];
    template5?: Template5Data[];
    template6?: {
      data: Template6Data[];
      additional: Template6Additional;
    };
    template7?: {
      mainTable: Template7MainData[];
      productionSupport: Template7ProductionSupportData[];
    };
  };
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    tableSpecificTotals?: {
      mainTable?: number;
      productionSupport?: number;
    };
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
  headers: string[];
  icon: string;
  hasMultipleTables?: boolean;
  additionalFields?: boolean;
}

export interface ProjectInvoiceData {
  projectId: string;
  accountId: string;
  projectName: string;
  accountName: string;
  resources: Resource[];
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

// Check if invoice already exists for project/month
export interface InvoiceExistenceCheck {
  exists: boolean;
  invoiceId?: string;
  previewUrl?: string;
  status?: string;
}