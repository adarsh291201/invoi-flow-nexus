import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateInvoiceStatus } from '../store/slices/invoiceSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
  ArrowLeft, 
  Download, 
  Check, 
  X, 
  MessageSquare, 
  Eye, 
  Send,
  Calendar,
  DollarSign,
  FileText,
  Building,
  User
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/use-toast';
import { Invoice, InvoiceStatus } from '../types';

const InvoicePreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { invoices } = useSelector((state: RootState) => state.invoices);
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    // Find invoice by ID or create mock data for preview
    const existingInvoice = invoices.find(inv => inv.id === id);
    
    if (existingInvoice) {
      setInvoice(existingInvoice);
    } else {
      // Mock invoice data for preview
      const mockInvoice: Invoice = {
        id: id || 'preview-001',
        project: 'Alpha - Migration',
        projectId: 'p101',
        client: 'Client Alpha Corp',
        status: 'Pending L2',
        amount: 12500,
        month: 'June',
        year: 2025,
        createdBy: 'Alice Johnson',
        createdAt: '2025-06-15T10:00:00Z',
        dueDate: '2025-06-30T00:00:00Z',
        pdfUrl: '/sample-invoice.pdf',
        history: [
          { 
            id: '1', 
            action: 'Generated', 
            by: 'Alice Johnson', 
            byId: 'u1', 
            date: '2025-06-15T10:00:00Z',
            comment: 'Invoice generated with standard template'
          },
        ],
      };
      setInvoice(mockInvoice);
    }
  }, [id, invoices]);

  const canApprove = () => {
    if (!invoice || !user) return false;
    if (user.role === 'L2' && invoice.status === 'Pending L2') return true;
    if (user.role === 'L3' && invoice.status === 'Pending L3') return true;
    return false;
  };

  const canReject = () => {
    if (!invoice || !user) return false;
    if (user.role === 'L2' && invoice.status === 'Pending L2') return true;
    if (user.role === 'L3' && invoice.status === 'Pending L3') return true;
    return false;
  };

  const canDispatch = () => {
    return user?.role === 'L1' && invoice?.status === 'Approved';
  };

  const getNextApprovalStatus = (currentStatus: InvoiceStatus): InvoiceStatus => {
    if (currentStatus === 'Pending L2') return 'Pending L3';
    if (currentStatus === 'Pending L3') return 'Approved';
    return currentStatus;
  };

  const handleApprove = () => {
    if (!invoice) return;
    
    const newStatus = getNextApprovalStatus(invoice.status);
    const commentText = comment.trim() || `Approved by ${user?.role}`;
    
    dispatch(updateInvoiceStatus({ 
      id: invoice.id, 
      status: newStatus, 
      comment: commentText 
    }));

    toast({
      title: "Invoice Approved",
      description: `Invoice has been approved and moved to ${newStatus}`,
      variant: "success",
    });

    // Update local state
    setInvoice(prev => prev ? { 
      ...prev, 
      status: newStatus,
      history: [
        ...prev.history,
        {
          id: Date.now().toString(),
          action: `Approved by ${user?.role}`,
          by: user?.name || 'Unknown',
          byId: user?.id || 'unknown',
          date: new Date().toISOString(),
          comment: commentText
        }
      ]
    } : null);

    setComment('');
    setShowCommentForm(false);
  };

  const handleReject = () => {
    if (!invoice || !comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment when rejecting an invoice.",
        variant: "destructive"
      });
      return;
    }

    dispatch(updateInvoiceStatus({ 
      id: invoice.id, 
      status: 'Rejected', 
      comment: comment.trim() 
    }));

    toast({
      title: "Invoice Rejected",
      description: "Invoice has been rejected with comments.",
    });

    // Update local state
    setInvoice(prev => prev ? { 
      ...prev, 
      status: 'Rejected',
      history: [
        ...prev.history,
        {
          id: Date.now().toString(),
          action: `Rejected by ${user?.role}`,
          by: user?.name || 'Unknown',
          byId: user?.id || 'unknown',
          date: new Date().toISOString(),
          comment: comment.trim()
        }
      ]
    } : null);

    setComment('');
    setShowCommentForm(false);
  };

  const handleDispatch = () => {
    if (!invoice) return;

    dispatch(updateInvoiceStatus({ 
      id: invoice.id, 
      status: 'Dispatched', 
      comment: 'Invoice dispatched to client' 
    }));

    toast({
      title: "Invoice Dispatched",
      description: "Invoice has been sent to the client.",
    });

    // Update local state
    setInvoice(prev => prev ? { 
      ...prev, 
      status: 'Dispatched',
      history: [
        ...prev.history,
        {
          id: Date.now().toString(),
          action: 'Dispatched to Client',
          by: user?.name || 'Unknown',
          byId: user?.id || 'unknown',
          date: new Date().toISOString(),
          comment: 'Invoice dispatched to client'
        }
      ]
    } : null);
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Invoice not found</h3>
          <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Preview</h1>
            <p className="text-muted-foreground">
              Invoice {invoice.id} - {invoice.project}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={invoice.status} />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mock Invoice Layout */}
              <div className="bg-background border-2 border-dashed border-muted rounded-lg p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold headline-blue">INVOICE</h2>
                    <p className="text-muted-foreground">#{invoice.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">InvoiceFlow Corp</p>
                    <p className="text-sm text-muted-foreground">123 Business St</p>
                    <p className="text-sm text-muted-foreground">City, State 12345</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-2">Bill To:</h3>
                    <p className="font-medium">{invoice.client}</p>
                    <p className="text-sm text-muted-foreground">123 Client Street</p>
                    <p className="text-sm text-muted-foreground">Client City, State 12345</p>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Date:</span>
                        <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Period:</span>
                        <span>{invoice.month} {invoice.year}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3">
                          <p className="font-medium">{invoice.project}</p>
                          <p className="text-sm text-muted-foreground">
                            Professional services for {invoice.month} {invoice.year}
                          </p>
                        </td>
                        <td className="text-right py-3 font-medium">
                          ${invoice.amount.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="py-4 text-right font-semibold">Total:</td>
                        <td className="py-4 text-right text-xl font-bold">
                          ${invoice.amount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t text-center text-sm text-muted-foreground">
                  <p>Thank you for your business!</p>
                  <p>Payment terms: Net 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          {(canApprove() || canReject() || showCommentForm) && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Add Comment</CardTitle>
                <CardDescription>
                  {canApprove() && 'Add a comment with your approval/rejection'}
                  {!canApprove() && 'Add a comment about this invoice'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your comment..."
                    className="min-h-24"
                  />
                </div>
                <div className="flex space-x-2">
                  {canApprove() && (
                    <Button onClick={handleApprove} className="bg-gradient-success">
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {canReject() && (
                    <Button variant="outline" onClick={handleReject} className="text-status-rejected border-status-rejected">
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}
                  {!canApprove() && !canReject() && (
                    <Button onClick={() => setShowCommentForm(false)} variant="blue">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{invoice.client}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="font-medium">{invoice.project}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-medium">{invoice.month} {invoice.year}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <p className="font-medium">{invoice.createdBy}</p>
                  </div>
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
              {!showCommentForm && (canApprove() || canReject()) && (
                <Button 
                  className="w-full" 
                  variant="blue"
                  onClick={() => setShowCommentForm(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              )}

              {canDispatch() && (
                <Button 
                  className="w-full bg-gradient-primary" 
                  variant="blue"
                  onClick={handleDispatch}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Dispatch to Client
                </Button>
              )}

              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Full Screen
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.history.map((entry) => (
                  <div key={entry.id} className="border-l-2 border-primary/20 pl-4 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          by {entry.by} • {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{entry.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;