import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RootState } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  InvoiceConfiguration, 
  InvoiceTemplate, 
  InvoiceSectionType,
  ProjectInvoiceData,
  InvoiceGenerationRequest,
  InvoicePreview
} from '../types/invoice';
import InvoiceService from '../services/invoiceService';
import TemplateSelector from '../components/Invoice/TemplateSelector';
import SectionSelector from '../components/Invoice/SectionSelector';
import InvoiceSectionComponent from '../components/Invoice/InvoiceSectionComponent';
import CommentModal from '../components/Invoice/CommentModal';
import PDFPreviewModal from '../components/Invoice/PDFPreviewModal';
import { 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  Download, 
  MessageSquare, 
  Save, 
  CheckCircle,
  Plus
} from 'lucide-react';

// Enhanced Invoice Generation with Object-Driven Approach

const InvoiceGeneration = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Enhanced state management
  const [step, setStep] = useState<'template' | 'sections' | 'configure'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [selectedSections, setSelectedSections] = useState<InvoiceSectionType[]>([]);
  const [projectData, setProjectData] = useState<ProjectInvoiceData | null>(null);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfiguration | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  
  // Modal states
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<InvoicePreview | null>(null);
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Initialize data and templates
  useEffect(() => {
    const initializeData = async () => {
      setIsLoadingData(true);
      
      try {
        // Load available templates
        const templates = InvoiceService.getAvailableTemplates();
        setAvailableTemplates(templates);

        // Pre-populate if project ID is in URL
        const projectId = searchParams.get('project');
        if (projectId) {
          const data = await InvoiceService.getProjectInvoiceData(projectId);
          setProjectData(data);
        }
      } catch (error) {
        toast({
          title: "Error Loading Data",
          description: "Failed to load project data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    initializeData();
  }, [searchParams, toast]);

  // Auto-save functionality
  useEffect(() => {
    if (invoiceConfig && step === 'configure') {
      const autoSaveTimer = setInterval(async () => {
        if (invoiceConfig.metadata.autoSaveEnabled) {
          setIsAutoSaving(true);
          try {
            await InvoiceService.autoSaveConfiguration(invoiceConfig);
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setIsAutoSaving(false);
          }
        }
      }, 30000); // 30 seconds

      return () => clearInterval(autoSaveTimer);
    }
  }, [invoiceConfig, step]);

  // Template selection handler
  const handleTemplateSelect = (template: InvoiceTemplate) => {
    const templateConfig = availableTemplates.find(t => t.id === template);
    if (templateConfig && projectData) {
      setSelectedTemplate(template);
      
      // Auto-select sections based on template and available data
      const autoSelectedSections: InvoiceSectionType[] = [];
      
      // Add required sections
      autoSelectedSections.push(...templateConfig.requiredSections);
      
      // Add default sections that have data
      templateConfig.defaultSections.forEach(section => {
        if (!autoSelectedSections.includes(section)) {
          const hasData = getAvailableDataForSection(section).length > 0;
          if (hasData) {
            autoSelectedSections.push(section);
          }
        }
      });
      
      setSelectedSections(autoSelectedSections);
      setStep('sections');
    }
  };

  // Section toggle handler
  const handleSectionToggle = (section: InvoiceSectionType, enabled: boolean) => {
    setSelectedSections(prev => 
      enabled 
        ? [...prev, section]
        : prev.filter(s => s !== section)
    );
  };

  // Get available data for a section type
  const getAvailableDataForSection = (sectionType: InvoiceSectionType): any[] => {
    if (!projectData) return [];
    
    switch (sectionType) {
      case 'standardHours': return projectData.standardHours;
      case 'overtimeHours': return projectData.overtimeHours;
      case 'weeklyWorkingHours': return projectData.weeklyWorkingHours;
      case 'productionSupport': return projectData.productionSupport;
      case 'services': return projectData.services;
      case 'licenses': return projectData.licenses;
      default: return [];
    }
  };

  // Proceed to configuration step
  const handleProceedToConfiguration = () => {
    if (selectedTemplate && projectData && selectedSections.length > 0) {
      const config = InvoiceService.createInvoiceConfiguration(
        projectData,
        selectedTemplate,
        selectedSections
      );
      setInvoiceConfig(config);
      setStep('configure');
    }
  };

  // Section data update handler
  const handleSectionDataUpdate = (sectionId: string, data: any[]) => {
    if (invoiceConfig) {
      const updatedConfig = InvoiceService.updateSectionData(invoiceConfig, sectionId, data);
      setInvoiceConfig(updatedConfig);
    }
  };

  // Add section handler
  const handleAddSection = (sectionType: InvoiceSectionType) => {
    if (invoiceConfig) {
      const updatedConfig = InvoiceService.addSectionToConfiguration(invoiceConfig, sectionType);
      setInvoiceConfig(updatedConfig);
      setSelectedSections(prev => [...prev, sectionType]);
    }
  };

  // Remove section handler
  const handleRemoveSection = (sectionId: string) => {
    if (invoiceConfig) {
      const section = invoiceConfig.sections.find(s => s.id === sectionId);
      if (section && !section.required) {
        const updatedConfig = InvoiceService.removeSectionFromConfiguration(invoiceConfig, sectionId);
        setInvoiceConfig(updatedConfig);
        setSelectedSections(prev => prev.filter(s => s !== section.type));
      }
    }
  };

  // Comment submission handler
  const handleSubmitComment = async (commentText: string, type: 'question' | 'clarification' | 'correction') => {
    if (!invoiceConfig) return;
    
    setIsSubmittingComment(true);
    
    try {
      const updatedConfig = InvoiceService.addComment(invoiceConfig, commentText);
      setInvoiceConfig(updatedConfig);
      
      // Mock PMO notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Comment Sent to PMO",
        description: "Your comment has been sent to PMO for review. Invoice generation is blocked until resolved.",
      });
      
      setIsCommentModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // PDF generation handler
  const handleGeneratePDF = async () => {
    if (!invoiceConfig) return;
    
    // Validate configuration
    const validation = InvoiceService.validateInvoiceConfiguration(invoiceConfig);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before generating PDF.",
        variant: "destructive"
      });
      return;
    }

    // Check for unresolved comments
    const hasUnresolvedComments = invoiceConfig.comments.some(c => c.status === 'pending');
    if (hasUnresolvedComments) {
      toast({
        title: "Cannot Generate Invoice",
        description: "Please resolve all pending comments before generating the invoice.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const request: InvoiceGenerationRequest = {
        configuration: invoiceConfig,
        format: 'pdf',
        includeAttachments: false
      };
      
      const response = await InvoiceService.generateInvoicePDF(request);
      
      if (response.success) {
        // Generate preview
        const preview = await InvoiceService.generatePreview(invoiceConfig);
        setPreviewData(preview);
        setIsPDFPreviewOpen(true);
        
        toast({
          title: "Invoice Generated Successfully",
          description: "PDF has been generated and is ready for download.",
        });
      } else {
        throw new Error(response.errors?.join(', ') || 'Generation failed');
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate invoice PDF.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Download handler
  const handleDownloadPDF = () => {
    if (previewData) {
      // Mock download - in real app, this would trigger actual download
      toast({
        title: "Download Started",
        description: "Invoice PDF download has started.",
      });
      
      setIsPDFPreviewOpen(false);
      navigate('/invoices');
    }
  };

  // Get available data for section selector
  const getAvailableDataMapping = (): Record<InvoiceSectionType, any[]> => {
    if (!projectData) return {} as Record<InvoiceSectionType, any[]>;
    
    return {
      standardHours: projectData.standardHours,
      overtimeHours: projectData.overtimeHours,
      weeklyWorkingHours: projectData.weeklyWorkingHours,
      productionSupport: projectData.productionSupport,
      services: projectData.services,
      licenses: projectData.licenses
    };
  };

  if (isLoadingData) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate Invoice</h1>
            <p className="text-muted-foreground">Loading project data...</p>
          </div>
        </div>
        
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate Invoice</h1>
            <p className="text-muted-foreground">
              {projectData ? `${projectData.projectName} - ${projectData.period.month} ${projectData.period.year}` : 'Create a new invoice'}
            </p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          <Badge variant={step === 'template' ? 'default' : step !== 'template' ? 'secondary' : 'outline'}>
            1. Template
          </Badge>
          <Badge variant={step === 'sections' ? 'default' : step === 'configure' ? 'secondary' : 'outline'}>
            2. Sections
          </Badge>
          <Badge variant={step === 'configure' ? 'default' : 'outline'}>
            3. Configure
          </Badge>
        </div>
      </div>

      {/* Unresolved Comments Alert */}
      {invoiceConfig && invoiceConfig.comments.some(c => c.status === 'pending') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are unresolved comments from PMO. Invoice generation is blocked until all comments are resolved.
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-save indicator */}
      {isAutoSaving && (
        <Alert>
          <Save className="h-4 w-4" />
          <AlertDescription>Auto-saving changes...</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Template Selection */}
      {step === 'template' && (
        <TemplateSelector
          templates={availableTemplates}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
        />
      )}

      {/* Step 2: Section Selection */}
      {step === 'sections' && (
        <div className="space-y-6">
          <SectionSelector
            selectedTemplate={availableTemplates.find(t => t.id === selectedTemplate) || null}
            selectedSections={selectedSections}
            availableData={getAvailableDataMapping()}
            onSectionToggle={handleSectionToggle}
          />
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('template')}>
              Back to Template
            </Button>
            <Button 
              onClick={handleProceedToConfiguration}
              disabled={selectedSections.length === 0}
              className="bg-gradient-primary"
            >
              Configure Invoice
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Invoice Configuration */}
      {step === 'configure' && invoiceConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Invoice Sections */}
            {invoiceConfig.sections.map((section) => (
              <InvoiceSectionComponent
                key={section.id}
                section={section}
                onDataUpdate={handleSectionDataUpdate}
                onRemoveSection={handleRemoveSection}
              />
            ))}
            
            {/* Add Section Button */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Add Additional Section</h4>
                  <div className="flex space-x-2">
                    {Object.keys(getAvailableDataMapping()).map((sectionType) => {
                      const isAlreadyAdded = selectedSections.includes(sectionType as InvoiceSectionType);
                      if (isAlreadyAdded) return null;
                      
                      return (
                        <Button
                          key={sectionType}
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSection(sectionType as InvoiceSectionType)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {sectionType.replace(/([A-Z])/g, ' $1').trim()}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Template:</span>
                    <span className="capitalize">{selectedTemplate?.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sections:</span>
                    <span>{invoiceConfig.sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comments:</span>
                    <span>{invoiceConfig.comments.length}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${invoiceConfig.totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>${invoiceConfig.totals.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${invoiceConfig.totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCommentModalOpen(true)}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
                
                <Button
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF || invoiceConfig.comments.some(c => c.status === 'pending')}
                  className="w-full bg-gradient-primary"
                >
                  {isGeneratingPDF ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Generate PDF</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmitComment={handleSubmitComment}
        existingComments={invoiceConfig?.comments || []}
        isSubmitting={isSubmittingComment}
      />

      <PDFPreviewModal
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
        preview={previewData}
        onDownload={handleDownloadPDF}
        isLoading={isGeneratingPDF}
      />
    </div>
  );
};

export default InvoiceGeneration;