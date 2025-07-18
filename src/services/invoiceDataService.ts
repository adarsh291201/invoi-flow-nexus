import { 
  InvoiceConfiguration, 
  InvoiceCommonData, 
  ProjectInvoiceData,
  InvoiceTemplate,
  InvoiceExistenceCheck,
  Template1Data,
  Template2Data,
  Template3Data,
  Template4Data,
  Template5Data,
  Template6Data,
  Template7MainData,
  Template7ProductionSupportData
} from '../types/invoice';
import { Resource } from '../types/index';

export class InvoiceDataService {
  
  // Check if invoice already exists for project/month
  static async checkInvoiceExists(projectId: string, month: string, year: number): Promise<InvoiceExistenceCheck> {
    // Mock implementation - replace with actual API call
    const existingInvoices = localStorage.getItem('existing_invoices');
    if (existingInvoices) {
      const invoices = JSON.parse(existingInvoices);
      const found = invoices.find((inv: any) => 
        inv.projectId === projectId && 
        inv.month === month && 
        inv.year === year
      );
      
      if (found) {
        return {
          exists: true,
          invoiceId: found.id,
          previewUrl: `/invoice/preview/${found.id}`,
          status: found.status
        };
      }
    }
    
    return { exists: false };
  }

  // Get project data for invoice generation
  static async getProjectInvoiceData(projectId: string): Promise<ProjectInvoiceData | null> {
    // Mock implementation - replace with actual API call
    try {
      const mockData: ProjectInvoiceData = {
        projectId,
        accountId: 'acc-001',
        projectName: 'Sample Project',
        accountName: 'Sample Account',
        resources: [
          {
            id: 'res-001',
            name: 'John Doe',
            role: 'Senior Developer',
            rate: 85,
            weekendRate: 100,
            otRate: 127.5,
            projectId
          },
          {
            id: 'res-002',
            name: 'Jane Smith',
            role: 'Project Manager',
            rate: 95,
            weekendRate: 110,
            otRate: 142.5,
            projectId
          }
        ],
        period: {
          month: new Date().toLocaleDateString('en-US', { month: 'long' }),
          year: new Date().getFullYear()
        }
      };
      
      return mockData;
    } catch (error) {
      console.error('Error fetching project data:', error);
      return null;
    }
  }

  // Pre-fill template data based on project resources
  static prepopulateTemplateData(
    template: InvoiceTemplate, 
    projectData: ProjectInvoiceData
  ): any[] {
    const { resources, projectName } = projectData;
    
    switch (template) {
      case 'template1':
        return resources.map((resource, index): Template1Data => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          name: resource.name,
          project: projectName,
          role: resource.role,
          rate: resource.rate,
          hrsWorked: 160, // Default 160 hours
          amount: resource.rate * 160
        }));
        
      case 'template2':
        return resources.map((resource, index): Template2Data => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          name: resource.name,
          role: resource.role,
          rate: resource.rate,
          hrsWorked: 160,
          amount: resource.rate * 160
        }));
        
      case 'template3':
        return resources.map((resource, index): Template3Data => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          description: `${resource.role} - ${resource.name}`,
          amount: resource.rate * 160
        }));
        
      case 'template4':
        return resources.map((resource, index): Template4Data => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          services: `${resource.role} Services`,
          cost: resource.rate * 160
        }));
        
      case 'template5':
        return resources.map((resource, index): Template5Data => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          description: `${resource.role} - ${resource.name}`,
          project: projectName,
          unit: 'Hours',
          amount: resource.rate * 160
        }));
        
      case 'template6':
        return resources.map((resource, index): Template6Data => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          name: resource.name,
          role: resource.role,
          rate: resource.rate,
          hrsWorked: 160,
          amount: resource.rate * 160
        }));
        
      case 'template7':
        return resources.map((resource, index): Template7MainData => ({
          id: `row-${resource.id}`,
          sNo: index + 1,
          name: resource.name,
          role: resource.role,
          rate: resource.rate,
          hrsWorked: 160,
          amount: resource.rate * 160
        }));
        
      default:
        return [];
    }
  }

  // Get default common data
  static getDefaultCommonData(): InvoiceCommonData {
    return {
      companyName: 'Your Company Name',
      companyAddress: '123 Business Street, City, State 12345',
      billTo: 'Client Company Name\n456 Client Street\nClient City, State 67890',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentTerms: 'Net 30',
      phoneNumber: '+1 (555) 123-4567',
      billingPeriod: `${new Date().toLocaleDateString('en-US', { month: 'long' })} ${new Date().getFullYear()}`
    };
  }

  // Calculate totals for template data
  static calculateTotals(templateData: any, template: InvoiceTemplate): any {
    let subtotal = 0;
    let tableSpecificTotals: any = {};

    switch (template) {
      case 'template1':
      case 'template2':
      case 'template6':
        subtotal = templateData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        break;
        
      case 'template3':
        subtotal = templateData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        break;
        
      case 'template4':
        subtotal = templateData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
        break;
        
      case 'template5':
        subtotal = templateData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        break;
        
      case 'template7':
        const mainTableTotal = templateData.mainTable?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
        const productionSupportTotal = templateData.productionSupport?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
        
        tableSpecificTotals.mainTable = mainTableTotal;
        tableSpecificTotals.productionSupport = productionSupportTotal;
        subtotal = mainTableTotal + productionSupportTotal;
        break;
        
      default:
        subtotal = 0;
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      ...(Object.keys(tableSpecificTotals).length > 0 && { tableSpecificTotals })
    };
  }

  // Save invoice configuration
  static async saveInvoiceConfiguration(config: InvoiceConfiguration): Promise<boolean> {
    try {
      // Auto-save to localStorage (replace with actual API call)
      const savedConfigs = localStorage.getItem('invoice_configurations') || '[]';
      const configs = JSON.parse(savedConfigs);
      
      const existingIndex = configs.findIndex((c: any) => c.id === config.id);
      if (existingIndex >= 0) {
        configs[existingIndex] = config;
      } else {
        configs.push(config);
      }
      
      localStorage.setItem('invoice_configurations', JSON.stringify(configs));
      return true;
    } catch (error) {
      console.error('Error saving invoice configuration:', error);
      return false;
    }
  }

  // Load invoice configuration
  static async loadInvoiceConfiguration(configId: string): Promise<InvoiceConfiguration | null> {
    try {
      const savedConfigs = localStorage.getItem('invoice_configurations') || '[]';
      const configs = JSON.parse(savedConfigs);
      
      return configs.find((c: any) => c.id === configId) || null;
    } catch (error) {
      console.error('Error loading invoice configuration:', error);
      return null;
    }
  }
}