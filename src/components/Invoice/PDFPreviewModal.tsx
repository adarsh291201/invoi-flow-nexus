import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { InvoicePreview } from '../../types/invoice';
import { Download, Eye, FileText, AlertTriangle } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: InvoicePreview | null;
  onDownload: () => void;
  isLoading?: boolean;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  preview,
  onDownload,
  isLoading = false
}) => {
  if (!preview) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice Preview</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-center h-64">
            {isLoading ? (
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Generating preview...</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No preview available</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <DialogTitle>Invoice Preview</DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {preview.estimatedPages} page{preview.estimatedPages !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {preview.configuration.template.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <DialogDescription>
            Preview of the generated invoice. Review all sections before downloading.
          </DialogDescription>
        </DialogHeader>

        {/* Warnings */}
        {preview.warnings.length > 0 && (
          <div className="space-y-2">
            {preview.warnings.map((warning, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden border rounded-lg bg-gray-50">
          <div className="h-full overflow-auto p-6">
            {/* Invoice Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">INVOICE</h1>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Invoice ID:</span> {preview.configuration.id}</p>
                    <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                    <p><span className="font-medium">Period:</span> {preview.configuration.month} {preview.configuration.year}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-2 text-sm">
                    <h3 className="font-medium text-gray-900">Bill To:</h3>
                    <p>{preview.configuration.clientInfo.name}</p>
                    <p className="text-gray-600">{preview.configuration.clientInfo.address}</p>
                    <p className="text-gray-600">{preview.configuration.clientInfo.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections Preview */}
            <div className="space-y-6">
              {preview.configuration.sections.map((section) => (
                <div key={section.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium text-lg mb-4">{section.name}</h3>
                  
                  {section.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {section.headers.map((header, index) => (
                              <th key={index} className="text-left py-2 font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.data.slice(0, 3).map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              {Object.values(item).slice(1).map((value, cellIndex) => (
                                <td key={cellIndex} className="py-2 text-gray-600">
                                  {typeof value === 'number' && ['amount', 'cost', 'rate'].some(field => 
                                    section.headers[cellIndex]?.toLowerCase().includes(field.toLowerCase())
                                  ) ? `$${value.toLocaleString()}` : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {section.data.length > 3 && (
                            <tr>
                              <td colSpan={section.headers.length} className="py-2 text-center text-gray-500 italic">
                                ... and {section.data.length - 3} more items
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No items in this section</p>
                  )}
                  
                  <div className="mt-4 text-right">
                    <p className="font-medium">Section Total: ${section.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${preview.configuration.totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>${preview.configuration.totals.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${preview.configuration.totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <Eye className="h-4 w-4 mr-2" />
            Close Preview
          </Button>
          <Button onClick={onDownload} className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;