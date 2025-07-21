import { supabase } from '../integrations/supabase/client';
import { InvoiceConfiguration } from '../types/invoice';

export interface InvoicePDFResponse {
  success: boolean;
  invoiceId?: string;
  downloadUrl?: string;
  previewUrl?: string;
  filePath?: string;
  error?: string;
}

export interface InvoicePreviewResponse {
  success: boolean;
  previewUrl?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    projectId: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    configuration?: InvoiceConfiguration;
  };
  error?: string;
}

export class InvoicePDFService {
  private static readonly FUNCTION_URL = 'https://fxnpnmvvyktljkmukkei.supabase.co/functions/v1';

  /**
   * Generate and store a PDF for the given invoice configuration
   */
  static async generatePDF(configuration: InvoiceConfiguration): Promise<InvoicePDFResponse> {
    try {
      console.log('Generating PDF for configuration:', configuration.id);

      const response = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { configuration }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate PDF');
      }

      return response.data as InvoicePDFResponse;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get preview URL for an existing invoice PDF
   */
  static async getInvoicePreview(invoiceId: string): Promise<InvoicePreviewResponse> {
    try {
      console.log('Getting preview for invoice:', invoiceId);

      const response = await supabase.functions.invoke('get-invoice-pdf', {
        body: { invoiceId, action: 'preview' }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get preview');
      }

      return response.data as InvoicePreviewResponse;
    } catch (error) {
      console.error('Error getting preview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get download URL for an existing invoice PDF
   */
  static async getDownloadUrl(invoiceId: string): Promise<{ success: boolean; downloadUrl?: string; fileName?: string; error?: string }> {
    try {
      console.log('Getting download URL for invoice:', invoiceId);

      const response = await supabase.functions.invoke('get-invoice-pdf', {
        body: { invoiceId, action: 'download' }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get download URL');
      }

      return response.data;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all invoices for the current user
   */
  static async getUserInvoices(): Promise<{ success: boolean; invoices?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        invoices: data
      };
    } catch (error) {
      console.error('Error getting user invoices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a specific invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<{ success: boolean; invoice?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        invoice: data
      };
    } catch (error) {
      console.error('Error getting invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete an invoice and its PDF file
   */
  static async deleteInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the invoice to get the file path
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('pdf_file_path')
        .eq('id', invoiceId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Delete the file from storage if it exists
      if (invoice.pdf_file_path) {
        const { error: storageError } = await supabase.storage
          .from('invoices')
          .remove([invoice.pdf_file_path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete the invoice record
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (deleteError) {
        throw deleteError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}