// Invoice Service Layer - Object-Driven Approach

import { 
  InvoiceConfiguration, 
  InvoiceSection,
  InvoiceSectionType,
  InvoiceTemplate,
  InvoiceTemplateConfig,
  ProjectInvoiceData,
  InvoiceGenerationRequest,
  InvoiceGenerationResponse,
  InvoiceValidationResult,
  InvoiceComment,
  InvoicePreview,
  StandardHoursData,
  OvertimeHoursData,
  WeeklyWorkingHoursData,
  ProductionSupportData,
  ServicesData,
  LicensesData
} from '../types/invoice';
import { Project, Resource } from '../types';

class InvoiceService {
  private static instance: InvoiceService;
  private autoSaveInterval: number = 30000; // 30 seconds

  public static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  // Template Configuration
  public getAvailableTemplates(): InvoiceTemplateConfig[] {
    return [
      {
        id: 'standard',
        name: 'Standard Template',
        description: 'Basic invoice with standard working hours',
        defaultSections: ['standardHours', 'services'],
        requiredSections: ['standardHours'],
        customizable: true,
        icon: 'FileText'
      },
      {
        id: 'time-material',
        name: 'Time and Material Template',
        description: 'Detailed time tracking with overtime and support hours',
        defaultSections: ['standardHours', 'overtimeHours', 'productionSupport'],
        requiredSections: ['standardHours'],
        customizable: true,
        icon: 'Clock'
      },
      {
        id: 'fixed-bid',
        name: 'Fixed Bid Template',
        description: 'Project-based billing with services and deliverables',
        defaultSections: ['services', 'licenses'],
        requiredSections: ['services'],
        customizable: true,
        icon: 'DollarSign'
      },
      {
        id: 'mixed-hybrid',
        name: 'Mixed/Hybrid Template',
        description: 'Combination of time-based and fixed-price components',
        defaultSections: ['standardHours', 'overtimeHours', 'services', 'licenses'],
        requiredSections: ['standardHours', 'services'],
        customizable: true,
        icon: 'Layers'
      }
    ];
  }

  // Section Configuration
  public getSectionConfiguration(): Record<InvoiceSectionType, any> {
    return {
      standardHours: {
        name: 'Standard Working Hours',
        headers: ['Name', 'Project', 'Role', 'Rate', 'Hrs Worked', 'Amount'],
        fieldMapping: ['name', 'project', 'role', 'rate', 'hoursWorked', 'amount'],
        editable: true,
        calculation: 'rate * hoursWorked'
      },
      overtimeHours: {
        name: 'Overtime Hours',
        headers: ['Name', 'Project', 'Role', 'Rate', 'Hrs Worked', 'Amount'],
        fieldMapping: ['name', 'project', 'role', 'rate', 'hoursWorked', 'amount'],
        editable: true,
        calculation: 'rate * hoursWorked'
      },
      weeklyWorkingHours: {
        name: 'Weekly Working Hours',
        headers: ['Name', 'Project', 'Hrs Worked', 'Amount'],
        fieldMapping: ['name', 'project', 'hoursWorked', 'amount'],
        editable: true,
        calculation: 'fixedRate * hoursWorked'
      },
      productionSupport: {
        name: 'Production Support Hours',
        headers: ['Name', 'Project', 'Hrs Worked', 'Amount'],
        fieldMapping: ['name', 'project', 'hoursWorked', 'amount'],
        editable: true,
        calculation: 'supportRate * hoursWorked'
      },
      services: {
        name: 'Services',
        headers: ['Service', 'Cost'],
        fieldMapping: ['service', 'cost'],
        editable: true,
        calculation: 'cost'
      },
      licenses: {
        name: 'Licenses/Subscription Costs',
        headers: ['License Name', 'Cost'],
        fieldMapping: ['licenseName', 'cost'],
        editable: true,
        calculation: 'cost'
      }
    };
  }

  // Data Pre-filling
  public async getProjectInvoiceData(projectId: string): Promise<ProjectInvoiceData> {
    // Mock data - will be replaced with actual API calls
    const mockData: ProjectInvoiceData = {
      projectId,
      accountId: 'acc001',
      projectName: 'Alpha - Migration',
      accountName: 'Client Alpha Corp',
      resources: [
        { id: 'r1', name: 'John Doe', role: 'Senior Developer', rate: 85, weekendRate: 120, otRate: 110, projectId },
        { id: 'r2', name: 'Jane Smith', role: 'Tech Lead', rate: 95, weekendRate: 140, otRate: 125, projectId },
      ],
      standardHours: [
        {
          id: '1',
          name: 'John Doe',
          project: 'Alpha - Migration',
          role: 'Senior Developer',
          rate: 85,
          hoursWorked: 160,
          amount: 13600
        },
        {
          id: '2',
          name: 'Jane Smith',
          project: 'Alpha - Migration',
          role: 'Tech Lead',
          rate: 95,
          hoursWorked: 160,
          amount: 15200
        }
      ],
      overtimeHours: [
        {
          id: '1',
          name: 'John Doe',
          project: 'Alpha - Migration',
          role: 'Senior Developer',
          rate: 110,
          hoursWorked: 20,
          amount: 2200
        }
      ],
      weeklyWorkingHours: [],
      productionSupport: [
        {
          id: '1',
          name: 'John Doe',
          project: 'Alpha - Migration',
          hoursWorked: 40,
          amount: 3400
        }
      ],
      services: [
        {
          id: '1',
          service: 'Database Migration Service',
          cost: 5000
        },
        {
          id: '2',
          service: 'Performance Optimization',
          cost: 3000
        }
      ],
      licenses: [
        {
          id: '1',
          licenseName: 'Enterprise Database License',
          cost: 2000
        }
      ],
      period: {
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear()
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockData;
  }

  // Invoice Configuration Creation
  public createInvoiceConfiguration(
    projectData: ProjectInvoiceData,
    template: InvoiceTemplate,
    selectedSections: InvoiceSectionType[]
  ): InvoiceConfiguration {
    const templateConfig = this.getAvailableTemplates().find(t => t.id === template);
    const sectionConfigs = this.getSectionConfiguration();
    
    const sections: InvoiceSection[] = selectedSections.map((sectionType, index) => {
      const config = sectionConfigs[sectionType];
      const data = this.getSectionDataForType(projectData, sectionType);
      
      return {
        id: `section-${sectionType}`,
        type: sectionType,
        name: config.name,
        enabled: true,
        required: templateConfig?.requiredSections.includes(sectionType) || false,
        order: index,
        headers: config.headers,
        data: data,
        total: this.calculateSectionTotal(data),
        editable: config.editable
      };
    });

    const subtotal = sections.reduce((sum, section) => sum + section.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return {
      id: `invoice-${projectData.projectId}-${Date.now()}`,
      projectId: projectData.projectId,
      accountId: projectData.accountId,
      template,
      month: projectData.period.month,
      year: projectData.period.year,
      sections,
      clientInfo: {
        name: projectData.accountName,
        address: '123 Client Street, City, State 12345',
        email: 'client@example.com'
      },
      totals: {
        subtotal,
        tax,
        total
      },
      comments: [],
      status: 'draft',
      metadata: {
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        lastModifiedBy: 'current-user',
        lastModifiedAt: new Date().toISOString(),
        autoSaveEnabled: true
      }
    };
  }

  private getSectionDataForType(projectData: ProjectInvoiceData, sectionType: InvoiceSectionType): any[] {
    switch (sectionType) {
      case 'standardHours':
        return projectData.standardHours;
      case 'overtimeHours':
        return projectData.overtimeHours;
      case 'weeklyWorkingHours':
        return projectData.weeklyWorkingHours;
      case 'productionSupport':
        return projectData.productionSupport;
      case 'services':
        return projectData.services;
      case 'licenses':
        return projectData.licenses;
      default:
        return [];
    }
  }

  private calculateSectionTotal(data: any[]): number {
    return data.reduce((sum, item) => {
      if ('amount' in item) return sum + item.amount;
      if ('cost' in item) return sum + item.cost;
      return sum;
    }, 0);
  }

  // Section Management
  public addSectionToConfiguration(
    config: InvoiceConfiguration,
    sectionType: InvoiceSectionType
  ): InvoiceConfiguration {
    const sectionConfigs = this.getSectionConfiguration();
    const sectionConfig = sectionConfigs[sectionType];
    
    const newSection: InvoiceSection = {
      id: `section-${sectionType}-${Date.now()}`,
      type: sectionType,
      name: sectionConfig.name,
      enabled: true,
      required: false,
      order: config.sections.length,
      headers: sectionConfig.headers,
      data: [],
      total: 0,
      editable: sectionConfig.editable
    };

    return {
      ...config,
      sections: [...config.sections, newSection],
      metadata: {
        ...config.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };
  }

  public removeSectionFromConfiguration(
    config: InvoiceConfiguration,
    sectionId: string
  ): InvoiceConfiguration {
    return {
      ...config,
      sections: config.sections.filter(section => section.id !== sectionId),
      metadata: {
        ...config.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };
  }

  public updateSectionData(
    config: InvoiceConfiguration,
    sectionId: string,
    data: any[]
  ): InvoiceConfiguration {
    const updatedSections = config.sections.map(section => {
      if (section.id === sectionId) {
        const newTotal = this.calculateSectionTotal(data);
        return {
          ...section,
          data,
          total: newTotal
        };
      }
      return section;
    });

    const subtotal = updatedSections.reduce((sum, section) => sum + section.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return {
      ...config,
      sections: updatedSections,
      totals: { subtotal, tax, total },
      metadata: {
        ...config.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };
  }

  // Validation
  public validateInvoiceConfiguration(config: InvoiceConfiguration): InvoiceValidationResult {
    const errors: any[] = [];

    // Check required sections
    const templateConfig = this.getAvailableTemplates().find(t => t.id === config.template);
    if (templateConfig) {
      templateConfig.requiredSections.forEach(requiredSection => {
        const hasSection = config.sections.some(s => s.type === requiredSection && s.enabled);
        if (!hasSection) {
          errors.push({
            field: `sections.${requiredSection}`,
            message: `Required section '${requiredSection}' is missing`,
            severity: 'error'
          });
        }
      });
    }

    // Validate section data
    config.sections.forEach(section => {
      if (section.enabled && section.data.length === 0) {
        errors.push({
          field: `sections.${section.type}`,
          message: `Section '${section.name}' is enabled but has no data`,
          severity: 'warning'
        });
      }

      // Validate individual section data
      section.data.forEach((item, index) => {
        if (section.type === 'standardHours' || section.type === 'overtimeHours') {
          if (!item.rate || item.rate <= 0) {
            errors.push({
              field: `sections.${section.type}.${index}.rate`,
              message: 'Rate must be greater than 0',
              severity: 'error'
            });
          }
          if (!item.hoursWorked || item.hoursWorked <= 0) {
            errors.push({
              field: `sections.${section.type}.${index}.hoursWorked`,
              message: 'Hours worked must be greater than 0',
              severity: 'error'
            });
          }
        }
      });
    });

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  // PDF Generation
  public async generateInvoicePDF(request: InvoiceGenerationRequest): Promise<InvoiceGenerationResponse> {
    // Validate before generation
    const validation = this.validateInvoiceConfiguration(request.configuration);
    if (!validation.isValid) {
      return {
        success: false,
        invoiceId: '',
        previewUrl: '',
        downloadUrl: '',
        errors: validation.errors.filter(e => e.severity === 'error').map(e => e.message)
      };
    }

    // Mock PDF generation - will be replaced with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const invoiceId = `INV-${request.configuration.projectId}-${Date.now()}`;
    
    return {
      success: true,
      invoiceId,
      previewUrl: `/api/invoice/preview/${invoiceId}`,
      downloadUrl: `/api/invoice/download/${invoiceId}`,
    };
  }

  // Comment Management
  public addComment(config: InvoiceConfiguration, commentText: string): InvoiceConfiguration {
    const newComment: InvoiceComment = {
      id: `comment-${Date.now()}`,
      text: commentText,
      author: 'Current User',
      authorId: 'current-user',
      timestamp: new Date().toISOString(),
      status: 'pending',
      type: 'question'
    };

    return {
      ...config,
      comments: [...config.comments, newComment],
      status: 'pending-approval',
      metadata: {
        ...config.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };
  }

  // Auto-save functionality
  public async autoSaveConfiguration(config: InvoiceConfiguration): Promise<void> {
    // Mock auto-save - will be replaced with actual API call
    console.log('Auto-saving invoice configuration:', config.id);
    
    // Update metadata
    config.metadata.lastAutoSave = new Date().toISOString();
  }

  // Preview generation
  public async generatePreview(config: InvoiceConfiguration): Promise<InvoicePreview> {
    // Mock preview generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      configuration: config,
      previewHtml: '<div>Invoice Preview HTML would be generated here</div>',
      estimatedPages: Math.ceil(config.sections.length / 2),
      warnings: config.sections.length > 5 ? ['Invoice has many sections and may be long'] : []
    };
  }
}

export default InvoiceService.getInstance();