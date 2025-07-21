import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { InvoicePDFService } from '../../services/invoicePDFService';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  DollarSign,
  Building,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface StoredInvoice {
  id: string;
  invoice_number: string;
  project_id: string;
  account_id: string;
  template_type: string;
  month: string;
  year: number;
  status: string;
  total_amount: number;
  currency: string;
  pdf_file_path?: string;
  created_at: string;
  updated_at: string;
  generated_at?: string;
  configuration: any;
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await InvoicePDFService.getUserInvoices();
      
      if (result.success && result.invoices) {
        setInvoices(result.invoices);
      } else {
        throw new Error(result.error || 'Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load invoices.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePreviewInvoice = async (invoice: StoredInvoice) => {
    setActionLoading(invoice.id);
    try {
      const result = await InvoicePDFService.getInvoicePreview(invoice.id);
      
      if (result.success && result.previewUrl) {
        // Open PDF in new tab
        window.open(result.previewUrl, '_blank');
        
        toast({
          title: "Preview Opened",
          description: "Invoice preview opened in a new tab.",
        });
      } else {
        throw new Error(result.error || 'Failed to get preview');
      }
    } catch (error) {
      console.error('Error previewing invoice:', error);
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Failed to preview invoice.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (invoice: StoredInvoice) => {
    setActionLoading(invoice.id);
    try {
      const result = await InvoicePDFService.getDownloadUrl(invoice.id);
      
      if (result.success && result.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName || `Invoice_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Invoice PDF download has started.",
        });
      } else {
        throw new Error(result.error || 'Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download Error",
        description: error instanceof Error ? error.message : "Failed to download invoice.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInvoice = async (invoice: StoredInvoice) => {
    setActionLoading(invoice.id);
    try {
      const result = await InvoicePDFService.deleteInvoice(invoice.id);
      
      if (result.success) {
        setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
        
        toast({
          title: "Invoice Deleted",
          description: "Invoice has been permanently deleted.",
        });
      } else {
        throw new Error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Failed to delete invoice.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'generated':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading invoices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold headline-blue">Generated Invoices</h2>
          <p className="text-muted-foreground">
            View, download, and manage your generated invoice PDFs
          </p>
        </div>
        <Button onClick={loadInvoices} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Invoices Generated</h3>
            <p className="text-muted-foreground">
              Once you generate invoices, they will appear here for easy access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">
                          Invoice {invoice.invoice_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Template: {invoice.template_type.replace('template', 'Template ')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Project</p>
                          <p className="text-muted-foreground">{invoice.project_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Period</p>
                          <p className="text-muted-foreground">
                            {invoice.month} {invoice.year}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Amount</p>
                          <p className="text-muted-foreground">
                            {formatAmount(invoice.total_amount, invoice.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Generated</p>
                          <p className="text-muted-foreground">
                            {formatDate(invoice.generated_at || invoice.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewInvoice(invoice)}
                      disabled={actionLoading === invoice.id}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice)}
                      disabled={actionLoading === invoice.id}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={actionLoading === invoice.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete invoice {invoice.invoice_number}? 
                            This action cannot be undone and will permanently remove the invoice and its PDF file.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;