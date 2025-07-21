import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  InvoiceTemplate, 
  InvoiceConfiguration,
  ProjectInvoiceData,
  InvoiceExistenceCheck
} from '../types/invoice';
import { InvoiceTemplateService } from '../services/invoiceTemplateService';
import { InvoiceDataService } from '../services/invoiceDataService';
import TemplateSelector from '../components/Invoice/TemplateSelector';
import InvoiceTemplateEditor from '../components/Invoice/InvoiceTemplateEditor';
import CommentModal from '../components/Invoice/CommentModal';
import PDFPreviewModal from '../components/Invoice/PDFPreviewModal';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  MessageSquarePlus,
  Eye,
  Clock
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setInvoices } from '../store/slices/invoiceSlice';
import { RootState } from '../store/index';

type Step = 'template' | 'configure' | 'review';

const InvoiceGeneration: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { templateId } = useParams();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const invoices = useSelector((state: RootState) => state.invoices.invoices);

  // State management
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [projectData, setProjectData] = useState<ProjectInvoiceData | null>(null);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfiguration | null>(null);
  const [existingInvoice, setExistingInvoice] = useState<InvoiceExistenceCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !invoiceConfig) return;

    const autoSaveInterval = setInterval(async () => {
      await InvoiceDataService.saveInvoiceConfiguration({
        ...invoiceConfig,
        metadata: {
          ...invoiceConfig.metadata,
          lastAutoSave: new Date().toISOString()
        }
      });
    }, 2000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [invoiceConfig, autoSaveEnabled]);

  // Initialize page data
  useEffect(() => {
    const initializePage = async () => {
      const projectId = searchParams.get('project');
      if (!projectId) {
        toast({
          title: "Error",
          description: "No project specified. Redirecting to accounts.",
          variant: "destructive",
        });
        navigate('/accounts');
        return;
      }

      setLoading(true);
      try {
        // Check if invoice already exists
        const currentDate = new Date();
        const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
        const year = currentDate.getFullYear();
        
        const existenceCheck = await InvoiceDataService.checkInvoiceExists(projectId, month, year);
        
        if (existenceCheck.exists) {
          setExistingInvoice(existenceCheck);
          setLoading(false);
          return;
        }

        // Load project data
        const data = await InvoiceDataService.getProjectInvoiceData(projectId);
        if (data) {
          setProjectData(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load project data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    if (templateId) {
      setSelectedTemplate(templateId as InvoiceTemplate);
      setStep('configure');
    }
  }, [templateId]);

  // Handle template selection
  const handleTemplateSelect = async (template: InvoiceTemplate) => {
    if (!projectData) return;

    setSelectedTemplate(template);
    navigate(`/invoice/generate/${template}?project=${projectData.projectId}`);
    
    // Create initial invoice configuration
    const config: InvoiceConfiguration = {
      id: `invoice-${Date.now()}`,
      projectId: projectData.projectId,
      accountId: projectData.accountId,
      template,
      month: projectData.period.month,
      year: projectData.period.year,
      commonData: InvoiceDataService.getDefaultCommonData(),
      templateData: {},
      totals: { subtotal: 0, tax: 0, total: 0 },
      comments: [],
      status: 'draft',
      metadata: {
        createdBy: 'Current User', // Replace with actual user
        createdAt: new Date().toISOString(),
        lastModifiedBy: 'Current User',
        lastModifiedAt: new Date().toISOString(),
        autoSaveEnabled: true
      }
    };

    // Pre-populate template data
    const prepopulatedData = InvoiceDataService.prepopulateTemplateData(template, projectData);
    
    if (template === 'template6') {
      config.templateData.template6 = {
        data: prepopulatedData,
        additional: {
          futureAccountCreditCurrentMonth: 0,
          futureAccountCreditPreviousMonth: 0,
          futureAccountCreditEndOfMonth: 0
        }
      };
    } else if (template === 'template7') {
      config.templateData.template7 = {
        mainTable: prepopulatedData,
        productionSupport: []
      };
    } else {
      config.templateData[template] = prepopulatedData;
    }

    // Calculate initial totals
    config.totals = InvoiceDataService.calculateTotals(config.templateData[template], template);

    setInvoiceConfig(config);
    setStep('configure');
  };

  // Handle configuration updates
  const handleConfigurationUpdate = (updatedConfig: InvoiceConfiguration) => {
    // Recalculate totals
    const templateData = updatedConfig.templateData[updatedConfig.template];
    updatedConfig.totals = InvoiceDataService.calculateTotals(templateData, updatedConfig.template);
    
    setInvoiceConfig(updatedConfig);
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!invoiceConfig) return;

    setLoading(true);
    try {
      const success = await InvoiceDataService.saveInvoiceConfiguration(invoiceConfig);
      if (success) {
        toast({
          title: "Draft Saved",
          description: "Your invoice draft has been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    console.log('handleGeneratePDF', invoiceConfig , "payload");
    if (!invoiceConfig) return;

    // Validate required fields
    if (!invoiceConfig.commonData.companyName || !invoiceConfig.commonData.billTo) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before generating PDF.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Here you would make API call to generate PDF
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "PDF Generated",
        description: "Your invoice PDF has been generated successfully.",
        variant: "success",
      });
      // Add the generated invoice to Redux store
      dispatch(setInvoices([...invoices, {
        id: invoiceConfig.id,
        project: projectData?.projectName || '',
        projectId: invoiceConfig.projectId,
        client: projectData?.accountName || '',
        status: 'Draft',
        amount: invoiceConfig.totals.total,
        month: invoiceConfig.month,
        year: invoiceConfig.year,
        createdBy: invoiceConfig.metadata.createdBy,
        createdAt: invoiceConfig.metadata.createdAt,
        dueDate: '',
        history: [
          { id: Date.now().toString(), action: 'Generated', by: invoiceConfig.metadata.createdBy, byId: 'current', date: new Date().toISOString() }
        ],
      }]));
      setShowPDFPreview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle comment addition
  const handleAddComment = (commentText: string) => {
    console.log('handleAddComment', commentText);
    if (!invoiceConfig) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      text: commentText,
      author: 'Current User',
      authorId: 'user-001',
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
      type: 'question' as const
    };

    const updatedConfig = {
      ...invoiceConfig,
      comments: [...invoiceConfig.comments, newComment],
      status: 'pending-approval' as const
    };

    setInvoiceConfig(updatedConfig);
    setShowCommentModal(false);

    toast({
      title: "Comment Added",
      description: "Your comment has been added and PMO has been notified.",
    });
  };

  // If invoice already exists for this project/month
  if (existingInvoice?.exists) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice Already Generated</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-lg">
                An invoice for this project and month has already been generated.
              </p>
              <Badge variant="outline" className="text-sm">
                Status: {existingInvoice.status}
              </Badge>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => window.open(existingInvoice.previewUrl, '_blank')}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview Invoice</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/accounts')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Button>
          <div>
            <h1 className="text-2xl font-bold headline-blue">Invoice Generation</h1>
            <p className="text-muted-foreground">
              {projectData ? `${projectData.projectName} - ${projectData.period.month} ${projectData.period.year}` : 'Create a new invoice'}
            </p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          <Badge variant={step === 'template' ? 'default' : 'secondary'}>
            1. Template
          </Badge>
          <Badge variant={step === 'configure' ? 'default' : 'secondary'}>
            2. Configure
          </Badge>
          <Badge variant={step === 'review' ? 'default' : 'secondary'}>
            3. Review
          </Badge>
        </div>
      </div>

      {loading && (
        <Card className="shadow-card">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Template Selection */}
      {step === 'template' && !loading && (
        <TemplateSelector
          templates={InvoiceTemplateService.getTemplates()}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
        />
      )}

      {/* Step 2: Configuration */}
      {step === 'configure' && selectedTemplate && invoiceConfig && !loading && (
        <div className="space-y-6">
          <InvoiceTemplateEditor
            configuration={invoiceConfig}
            onConfigurationUpdate={handleConfigurationUpdate}
          />
          
          {/* Action Buttons */}
          <Card className="shadow-card">
            <CardContent className="flex justify-between items-center p-6">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => setStep('template')}>
                  Back to Templates
                </Button>
                <Button onClick={handleSaveDraft} disabled={loading} variant="blue">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCommentModal(true)}
                  disabled={invoiceConfig.status === 'pending-approval'}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
                <Button 
                  onClick={handleGeneratePDF}
                  disabled={loading || invoiceConfig.status === 'pending-approval'}
                  variant="blue"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CommentModal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        onSubmitComment={(comment, type) => handleAddComment(comment)}
        existingComments={invoiceConfig?.comments || []}
      />

      {invoiceConfig && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          preview={{
            configuration: invoiceConfig,
            previewHtml: '',
            estimatedPages: 1,
            warnings: []
          }}
          onDownload={() => {
            console.log('Download PDF');
          }}
        />
      )}
    </div>
  );
};

export default InvoiceGeneration;