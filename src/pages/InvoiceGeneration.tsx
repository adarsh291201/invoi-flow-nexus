import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RootState } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { AlertCircle, FileText, Send, ArrowLeft, Calculator, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { Account, Project, Resource } from '../types';

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
}

interface InvoiceData {
  accountId: string;
  projectId: string;
  month: string;
  year: number;
  templateId: string;
  amount: number;
  description: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  comments: string;
}

const InvoiceGeneration = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    accountId: '',
    projectId: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    templateId: '',
    amount: 0,
    description: '',
    lineItems: [],
    comments: ''
  });
  const [hasUnresolvedComments, setHasUnresolvedComments] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Mock data
    const mockAccounts: Account[] = [
      {
        id: 'acc001',
        name: 'Client Alpha Corp',
        projects: [
          {
            id: 'p101',
            name: 'Alpha - Migration',
            accountId: 'acc001',
            resources: [
              { id: 'r1', name: 'John Doe', role: 'Senior Developer', rate: 85, weekendRate: 120, otRate: 110, projectId: 'p101' },
              { id: 'r2', name: 'Jane Smith', role: 'Tech Lead', rate: 95, weekendRate: 140, otRate: 125, projectId: 'p101' },
            ]
          }
        ]
      },
      {
        id: 'acc002',
        name: 'Client Beta Solutions',
        projects: [
          {
            id: 'p201',
            name: 'Beta - Development',
            accountId: 'acc002',
            resources: [
              { id: 'r4', name: 'Sarah Wilson', role: 'Full Stack Developer', rate: 80, weekendRate: 115, otRate: 105, projectId: 'p201' },
              { id: 'r5', name: 'David Brown', role: 'DevOps Engineer', rate: 90, weekendRate: 130, otRate: 115, projectId: 'p201' },
            ]
          }
        ]
      }
    ];

    const mockTemplates: InvoiceTemplate[] = [
      {
        id: 'template1',
        name: 'Standard Template',
        description: 'Basic invoice template with standard fields',
        fields: ['project', 'period', 'amount', 'description']
      },
      {
        id: 'template2',
        name: 'Detailed Template',
        description: 'Comprehensive template with itemized breakdown',
        fields: ['project', 'period', 'amount', 'lineItems', 'resources', 'description']
      },
      {
        id: 'template3',
        name: 'Time & Materials',
        description: 'Template for hourly-based billing',
        fields: ['project', 'period', 'timesheet', 'rates', 'amount', 'description']
      }
    ];

    setAccounts(mockAccounts);
    setTemplates(mockTemplates);

    // Pre-populate if project ID is in URL
    const projectId = searchParams.get('project');
    if (projectId) {
      const account = mockAccounts.find(acc => 
        acc.projects.some(proj => proj.id === projectId)
      );
      const project = account?.projects.find(proj => proj.id === projectId);
      
      if (account && project) {
        setInvoiceData(prev => ({
          ...prev,
          accountId: account.id,
          projectId: project.id,
          description: `Services for ${project.name} - ${prev.month} ${prev.year}`
        }));
        autoCalculateAmount(project);
      }
    }

    // Mock check for unresolved comments
    setHasUnresolvedComments(Math.random() > 0.7);
  }, [searchParams]);

  const autoCalculateAmount = (project: Project) => {
    // Mock calculation based on resources
    const baseHours = 160; // Standard month
    const totalAmount = project.resources.reduce((sum, resource) => {
      return sum + (resource.rate * baseHours);
    }, 0);
    
    setInvoiceData(prev => ({
      ...prev,
      amount: totalAmount,
      lineItems: project.resources.map(resource => ({
        description: `${resource.name} - ${resource.role}`,
        quantity: baseHours,
        rate: resource.rate,
        amount: resource.rate * baseHours
      }))
    }));
  };

  const getSelectedAccount = () => {
    return accounts.find(acc => acc.id === invoiceData.accountId);
  };

  const getSelectedProject = () => {
    const account = getSelectedAccount();
    return account?.projects.find(proj => proj.id === invoiceData.projectId);
  };

  const getAvailableProjects = () => {
    const account = getSelectedAccount();
    return account?.projects || [];
  };

  const handleAccountChange = (accountId: string) => {
    setInvoiceData(prev => ({
      ...prev,
      accountId,
      projectId: '', // Reset project when account changes
      lineItems: [],
      amount: 0
    }));
  };

  const handleProjectChange = (projectId: string) => {
    const account = getSelectedAccount();
    const project = account?.projects.find(proj => proj.id === projectId);
    
    setInvoiceData(prev => ({
      ...prev,
      projectId,
      description: project ? `Services for ${project.name} - ${prev.month} ${prev.year}` : ''
    }));

    if (project) {
      autoCalculateAmount(project);
    }
  };

  const handleGenerateInvoice = async () => {
    if (hasUnresolvedComments) {
      toast({
        title: "Cannot Generate Invoice",
        description: "Please resolve all pending comments before generating the invoice.",
        variant: "destructive"
      });
      return;
    }

    if (!invoiceData.accountId || !invoiceData.projectId || !invoiceData.templateId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Mock generation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Invoice Generated Successfully",
      description: "Invoice has been generated and submitted for L2 approval.",
    });

    setIsGenerating(false);
    navigate('/invoices');
  };

  const sendCommentToPMO = () => {
    if (!invoiceData.comments.trim()) {
      toast({
        title: "No Comment",
        description: "Please enter a comment before sending to PMO.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Comment Sent to PMO",
      description: "Your comment has been sent to PMO for review. Invoice generation is blocked until resolved.",
      variant: "default"
    });

    setHasUnresolvedComments(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for the current month
          </p>
        </div>
      </div>

      {/* Unresolved Comments Alert */}
      {hasUnresolvedComments && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are unresolved comments from PMO. Invoice generation is blocked until all comments are resolved.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account & Project Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Account & Project</CardTitle>
              <CardDescription>Select the account and project for this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="account">Account</Label>
                <Select value={invoiceData.accountId} onValueChange={handleAccountChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project">Project</Label>
                <Select 
                  value={invoiceData.projectId} 
                  onValueChange={handleProjectChange}
                  disabled={!invoiceData.accountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableProjects().map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Input
                    value={invoiceData.month}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, month: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    type="number"
                    value={invoiceData.year}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoice Template</CardTitle>
              <CardDescription>Choose a template for your invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      invoiceData.templateId === template.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setInvoiceData(prev => ({ ...prev, templateId: template.id }))}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.fields.map(field => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Configure the invoice data and line items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Total Amount ($)</Label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={invoiceData.amount}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={invoiceData.description}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter invoice description..."
                  className="min-h-20"
                />
              </div>

              {/* Line Items */}
              {invoiceData.lineItems.length > 0 && (
                <div>
                  <Label>Line Items</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">Qty</th>
                          <th className="text-left p-3">Rate</th>
                          <th className="text-left p-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.lineItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.description}</td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">${item.rate}</td>
                            <td className="p-3 font-medium">${item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Comments for PMO</CardTitle>
              <CardDescription>Add comments if issues are found during generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={invoiceData.comments}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Enter any issues or comments for PMO review..."
                className="min-h-24"
              />
              <Button variant="outline" onClick={sendCommentToPMO}>
                <Send className="h-4 w-4 mr-2" />
                Send Comment to PMO
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview & Actions */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span>{getSelectedAccount()?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span>{getSelectedProject()?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span>{invoiceData.month} {invoiceData.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template:</span>
                  <span>{templates.find(t => t.id === invoiceData.templateId)?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Amount:</span>
                  <span>${invoiceData.amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-primary"
                onClick={handleGenerateInvoice}
                disabled={hasUnresolvedComments || isGenerating}
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </>
                )}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGeneration;