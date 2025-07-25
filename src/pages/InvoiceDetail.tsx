import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Eye, Pencil, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { InvoiceDataService } from '../services/invoiceDataService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import StatusBadge from '../components/StatusBadge';

interface InvoiceDetail {
  id: number;
  invoiceConfigId: string;
  projectId: string;
  accountId: string;
  template: string;
  month: string;
  year: number;
  status: string;
  amount: number;
  createdAt: string;
  previewUrl: string;
  downloadUrl: string;
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceDetail | null>(null);
  const [previousInvoices, setPreviousInvoices] = useState<InvoiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewingInvoiceId, setPreviewingInvoiceId] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        
        // Fetch current invoice details
        const currentInvoiceData = await InvoiceDataService.fetchInvoiceById(id);
        if (currentInvoiceData) {
          let totals = {};
          try { totals = JSON.parse(currentInvoiceData.totalsJson || '{}'); } catch {}
          
          setCurrentInvoice({
            ...currentInvoiceData,
            amount: (totals as any).total || 0,
          });
          
          // Fetch all invoices for the same project
          const allInvoices = await InvoiceDataService.fetchAllInvoices();
          const projectInvoices = allInvoices
            .filter((inv: any) => inv.projectId === currentInvoiceData.projectId)
            .map((inv: any) => {
              let invTotals = {};
              try { invTotals = JSON.parse(inv.totalsJson || '{}'); } catch {}
              return {
                ...inv,
                amount: (invTotals as any).total || 0,
              };
            })
            .sort((a: any, b: any) => {
              // Sort by year and month (newest first)
              const dateA = new Date(a.year, getMonthNumber(a.month));
              const dateB = new Date(b.year, getMonthNumber(b.month));
              return dateB.getTime() - dateA.getTime();
            });
          
          setPreviousInvoices(projectInvoices);
        }
      } catch (error) {
        console.error('Failed to fetch invoice data:', error);
        toast({
          title: "Error",
          description: "Failed to load invoice details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id, toast]);

  const getMonthNumber = (month: string): number => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(month);
  };

  const handlePreview = async (invoiceId: string) => {
    try {
      setPreviewingInvoiceId(invoiceId);
      const response = await fetch(`http://localhost:5133/invoice/${invoiceId}/download`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      previewUrlRef.current = url;
      setPreviewOpen(true);
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: 'Could not load PDF preview.',
        variant: "destructive"
      });
    }
  };

  // Clean up object URL when modal closes
  useEffect(() => {
    if (!previewOpen && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
      setPreviewingInvoiceId(null);
    }
  }, [previewOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!currentInvoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Invoice not found</h3>
          <p className="text-muted-foreground mb-4">
            The invoice you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
            <p className="text-muted-foreground">
              {currentInvoice.projectId} - {currentInvoice.month} {currentInvoice.year}
            </p>
          </div>
        </div>
        
        {/* Edit button for L1 users */}
        {user?.role === 'L1' && (
          <Button asChild variant="blue">
            <Link to={`/invoice/edit/${currentInvoice.invoiceConfigId}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Invoice
            </Link>
          </Button>
        )}
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Top Half - Current Invoice Preview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Invoice Preview</span>
              <div className="flex items-center space-x-2">
                <StatusBadge status={currentInvoice.status} />
                <Badge variant="outline">
                  {currentInvoice.month} {currentInvoice.year}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-semibold">{currentInvoice.projectId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">{currentInvoice.accountId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">${currentInvoice.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Template</p>
                  <p className="font-semibold">{currentInvoice.template}</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => handlePreview(currentInvoice.invoiceConfigId)}
                  variant="outline"
                  size="lg"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Preview Current Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Half - Previous Months Invoices */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Previous Months Invoices</CardTitle>
            <p className="text-sm text-muted-foreground">
              All invoices for project: {currentInvoice.projectId}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4">Invoice ID</th>
                    <th className="text-left p-4">Period</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {previousInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-mono text-sm">{invoice.invoiceConfigId}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {invoice.month} {invoice.year}
                        </Badge>
                      </td>
                      <td className="p-4 font-semibold">${invoice.amount.toLocaleString()}</td>
                      <td className="p-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handlePreview(invoice.invoiceConfigId)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.role === 'L1' && (
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/invoice/edit/${invoice.invoiceConfigId}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previousInvoices.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No previous invoices found for this project.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Invoice Preview - {previewingInvoiceId}
            </DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <iframe
              src={previewUrl}
              width="100%"
              height="100%"
              style={{ flex: 1, border: 'none', minHeight: '70vh' }}
              title="Invoice PDF Preview"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading PDF...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetail; 