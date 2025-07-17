import { InvoiceTemplateConfig, InvoiceTemplate } from '../types/invoice';
import { 
  FileText, 
  Users, 
  FileBarChart, 
  Briefcase, 
  Package, 
  Calculator,
  Database 
} from 'lucide-react';

export class InvoiceTemplateService {
  private static templates: InvoiceTemplateConfig[] = [
    {
      id: 'template1',
      name: 'Template 1 - Full Resource Details',
      description: 'Comprehensive template with S.No, Name, Project, Role, Rate, Hours Worked, Amount',
      headers: ['S.No', 'Name', 'Project', 'Role', 'Rate', 'Hrs Worked', 'Amount'],
      icon: 'FileText',
    },
    {
      id: 'template2',
      name: 'Template 2 - Basic Resource Info',
      description: 'Simplified template with S.No, Name, Role, Rate, Hours Worked, Amount',
      headers: ['S.No', 'Name', 'Role', 'Rate', 'Hrs Worked', 'Amount'],
      icon: 'Users',
    },
    {
      id: 'template3',
      name: 'Template 3 - Description Based',
      description: 'Simple description and amount format',
      headers: ['S.No', 'Description', 'Amount'],
      icon: 'FileBarChart',
    },
    {
      id: 'template4',
      name: 'Template 4 - Services',
      description: 'Service-oriented template with services and costs',
      headers: ['S.No', 'Services', 'Cost'],
      icon: 'Briefcase',
    },
    {
      id: 'template5',
      name: 'Template 5 - Unit Based',
      description: 'Project-based with units and descriptions',
      headers: ['S.No', 'Description', 'Project', 'Unit', 'Amount'],
      icon: 'Package',
    },
    {
      id: 'template6',
      name: 'Template 6 - Future Account Credits',
      description: 'Resource template with future account credit calculations',
      headers: ['S.No', 'Name', 'Role', 'Rate', 'Hrs Worked', 'Amount'],
      icon: 'Calculator',
      additionalFields: true,
    },
    {
      id: 'template7',
      name: 'Template 7 - Dual Tables',
      description: 'Two separate tables: Main work and Production Support',
      headers: ['S.No', 'Name', 'Role', 'Rate', 'Hrs Worked', 'Amount'],
      icon: 'Database',
      hasMultipleTables: true,
    },
  ];

  static getTemplates(): InvoiceTemplateConfig[] {
    return this.templates;
  }

  static getTemplate(id: InvoiceTemplate): InvoiceTemplateConfig | undefined {
    return this.templates.find(template => template.id === id);
  }

  static getTemplateHeaders(id: InvoiceTemplate): string[] {
    const template = this.getTemplate(id);
    return template?.headers || [];
  }

  static hasMultipleTables(id: InvoiceTemplate): boolean {
    const template = this.getTemplate(id);
    return template?.hasMultipleTables || false;
  }

  static hasAdditionalFields(id: InvoiceTemplate): boolean {
    const template = this.getTemplate(id);
    return template?.additionalFields || false;
  }

  static createEmptyRowData(templateId: InvoiceTemplate, isProductionSupport = false): any {
    const baseRow = { id: `row-${Date.now()}-${Math.random()}`, sNo: 0 };
    
    switch (templateId) {
      case 'template1':
        return {
          ...baseRow,
          name: '',
          project: '',
          role: '',
          rate: 0,
          hrsWorked: 0,
          amount: 0
        };
      case 'template2':
        return {
          ...baseRow,
          name: '',
          role: '',
          rate: 0,
          hrsWorked: 0,
          amount: 0
        };
      case 'template3':
        return {
          ...baseRow,
          description: '',
          amount: 0
        };
      case 'template4':
        return {
          ...baseRow,
          services: '',
          cost: 0
        };
      case 'template5':
        return {
          ...baseRow,
          description: '',
          project: '',
          unit: '',
          amount: 0
        };
      case 'template6':
        return {
          ...baseRow,
          name: '',
          role: '',
          rate: 0,
          hrsWorked: 0,
          amount: 0
        };
      case 'template7':
        return {
          ...baseRow,
          name: '',
          role: '',
          rate: 0,
          hrsWorked: 0,
          amount: 0
        };
      default:
        return baseRow;
    }
  }
}