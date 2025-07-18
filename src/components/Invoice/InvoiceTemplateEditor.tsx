import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  InvoiceConfiguration, 
  InvoiceTemplate,
  Template1Data,
  Template2Data,
  Template3Data,
  Template4Data,
  Template5Data,
  Template6Data,
  Template7MainData,
  Template7ProductionSupportData,
  Template6Additional
} from '../../types/invoice';
import { InvoiceTemplateService } from '../../services/invoiceTemplateService';
import { InvoiceDataService } from '../../services/invoiceDataService';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Calculator,
  Info
} from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';

interface InvoiceTemplateEditorProps {
  configuration: InvoiceConfiguration;
  onConfigurationUpdate: (config: InvoiceConfiguration) => void;
}

const InvoiceTemplateEditor: React.FC<InvoiceTemplateEditorProps> = ({
  configuration,
  onConfigurationUpdate
}) => {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  // Handle common data updates
  const handleCommonDataUpdate = (field: string, value: string) => {
    const updatedConfig = {
      ...configuration,
      commonData: {
        ...configuration.commonData,
        [field]: value
      },
      metadata: {
        ...configuration.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };
    onConfigurationUpdate(updatedConfig);
  };

  // Handle template data updates
  const handleTemplateDataUpdate = (data: any[], tableName?: string) => {
    const updatedTemplateData = { ...configuration.templateData };
    
    if (configuration.template === 'template6') {
      updatedTemplateData.template6!.data = data;
    } else if (configuration.template === 'template7') {
      if (tableName === 'productionSupport') {
        updatedTemplateData.template7!.productionSupport = data;
      } else {
        updatedTemplateData.template7!.mainTable = data;
      }
    } else {
      (updatedTemplateData as any)[configuration.template] = data;
    }

    const updatedConfig = {
      ...configuration,
      templateData: updatedTemplateData,
      metadata: {
        ...configuration.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };

    // Recalculate totals
    updatedConfig.totals = InvoiceDataService.calculateTotals(
      updatedTemplateData[configuration.template], 
      configuration.template
    );

    onConfigurationUpdate(updatedConfig);
  };

  // Handle Template 6 additional fields
  const handleTemplate6AdditionalUpdate = (field: keyof Template6Additional, value: number) => {
    if (configuration.template !== 'template6' || !configuration.templateData.template6) return;

    const updatedConfig = {
      ...configuration,
      templateData: {
        ...configuration.templateData,
        template6: {
          ...configuration.templateData.template6,
          additional: {
            ...configuration.templateData.template6.additional,
            [field]: value
          }
        }
      },
      metadata: {
        ...configuration.metadata,
        lastModifiedAt: new Date().toISOString()
      }
    };

    onConfigurationUpdate(updatedConfig);
  };

  // Add new row
  const handleAddRow = (tableName?: string) => {
    const newRow = InvoiceTemplateService.createEmptyRowData(
      configuration.template, 
      tableName === 'productionSupport'
    );
    
    let currentData: any[] = [];
    
    if (configuration.template === 'template6') {
      currentData = configuration.templateData.template6?.data || [];
    } else if (configuration.template === 'template7') {
      if (tableName === 'productionSupport') {
        currentData = configuration.templateData.template7?.productionSupport || [];
      } else {
        currentData = configuration.templateData.template7?.mainTable || [];
      }
    } else {
      currentData = (configuration.templateData as any)[configuration.template] || [];
    }

    // Update serial numbers
    newRow.sNo = currentData.length + 1;
    const updatedData = [...currentData, newRow];
    
    handleTemplateDataUpdate(updatedData, tableName);
  };

  // Delete row
  const handleDeleteRow = (rowId: string, tableName?: string) => {
    let currentData: any[] = [];
    
    if (configuration.template === 'template6') {
      currentData = configuration.templateData.template6?.data || [];
    } else if (configuration.template === 'template7') {
      if (tableName === 'productionSupport') {
        currentData = configuration.templateData.template7?.productionSupport || [];
      } else {
        currentData = configuration.templateData.template7?.mainTable || [];
      }
    } else {
      currentData = (configuration.templateData as any)[configuration.template] || [];
    }

    const updatedData = currentData
      .filter(item => item.id !== rowId)
      .map((item, index) => ({ ...item, sNo: index + 1 })); // Re-number
    
    handleTemplateDataUpdate(updatedData, tableName);
  };

  // Start editing row
  const handleEditRow = (row: any) => {
    setEditingRowId(row.id);
    setEditingData({ ...row });
  };

  // Save edited row
  const handleSaveRow = (tableName?: string) => {
    let currentData: any[] = [];
    
    if (configuration.template === 'template6') {
      currentData = configuration.templateData.template6?.data || [];
    } else if (configuration.template === 'template7') {
      if (tableName === 'productionSupport') {
        currentData = configuration.templateData.template7?.productionSupport || [];
      } else {
        currentData = configuration.templateData.template7?.mainTable || [];
      }
    } else {
      currentData = (configuration.templateData as any)[configuration.template] || [];
    }

    const updatedData = currentData.map(item =>
      item.id === editingRowId ? { ...editingData } : item
    );
    
    handleTemplateDataUpdate(updatedData, tableName);
    setEditingRowId(null);
    setEditingData({});
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...editingData, [field]: value };
    
    // Auto-calculate amount for applicable templates
    if (['template1', 'template2', 'template6', 'template7'].includes(configuration.template) && 
        (field === 'rate' || field === 'hrsWorked')) {
      const rate = field === 'rate' ? parseFloat(value) || 0 : updatedData.rate || 0;
      const hours = field === 'hrsWorked' ? parseFloat(value) || 0 : updatedData.hrsWorked || 0;
      updatedData.amount = rate * hours;
    }
    
    setEditingData(updatedData);
  };

  // Render table for template data
  const renderTemplateTable = (data: any[], headers: string[], tableName?: string, tableTitle?: string) => {
    return (
      <Card className="shadow-card">
        {tableTitle && (
          <CardHeader>
            <CardTitle className="text-lg">{tableTitle}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} className="text-left p-3 text-sm font-medium">
                        {header}
                      </th>
                    ))}
                    <th className="text-right p-3 text-sm font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length + 1} className="p-8 text-center text-muted-foreground">
                        No data available. Click "Add Row" to add entries.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => {
                      const isEditing = editingRowId === item.id;
                      
                      return (
                        <tr key={item.id} className={`border-t ${isEditing ? 'bg-primary/5' : ''}`}>
                          {headers.map((header, fieldIndex) => {
                            const field = getFieldNameFromHeader(header, configuration.template);
                            const value = isEditing ? editingData[field] : item[field];
                            
                            return (
                              <td key={fieldIndex} className="p-3 text-sm">
                                {renderCell(field, value, isEditing)}
                              </td>
                            );
                          })}
                          <td className="p-3 text-right">
                            <div className="flex justify-end space-x-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSaveRow(tableName)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditRow(item)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteRow(item.id, tableName)}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <Button
              variant="outline"
              onClick={() => handleAddRow(tableName)}
              className="w-full"
              disabled={editingRowId !== null}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render cell content
  const renderCell = (field: string, value: any, isEditing: boolean) => {
    if (isEditing) {
      const inputType = ['rate', 'hrsWorked', 'amount', 'cost'].includes(field) ? 'number' : 'text';
      const isReadOnly = field === 'amount' && ['template1', 'template2', 'template6', 'template7'].includes(configuration.template);
      
      return (
        <Input
          type={inputType}
          value={value || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className="h-8 text-sm"
          readOnly={isReadOnly}
          step={inputType === 'number' ? '0.01' : undefined}
        />
      );
    }
    
    if (['rate', 'amount', 'cost'].includes(field)) {
      return <span>${(value || 0).toLocaleString()}</span>;
    }
    
    return <span>{value || '-'}</span>;
  };

  // Get field name from header
  const getFieldNameFromHeader = (header: string, template: InvoiceTemplate): string => {
    const mapping: { [key: string]: string } = {
      'S.No': 'sNo',
      'Name': 'name',
      'Project': 'project',
      'Role': 'role',
      'Rate': 'rate',
      'Hrs Worked': 'hrsWorked',
      'Amount': 'amount',
      'Description': 'description',
      'Services': 'services',
      'Cost': 'cost',
      'Unit': 'unit'
    };
    return mapping[header] || header.toLowerCase();
  };

  // Get template data for rendering
  const getTemplateData = () => {
    if (configuration.template === 'template6') {
      return configuration.templateData.template6?.data || [];
    } else if (configuration.template === 'template7') {
      return {
        mainTable: configuration.templateData.template7?.mainTable || [],
        productionSupport: configuration.templateData.template7?.productionSupport || []
      };
    } else {
      return (configuration.templateData as any)[configuration.template] || [];
    }
  };

  const templateConfig = InvoiceTemplateService.getTemplate(configuration.template);
  const templateData = getTemplateData();

  return (
    <div className="space-y-6">
      {/* Common Invoice Data */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Invoice Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={configuration.commonData.companyName}
              onChange={(e) => handleCommonDataUpdate('companyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Invoice Number</Label>
            <Input
              value={configuration.commonData.invoiceNumber}
              onChange={(e) => handleCommonDataUpdate('invoiceNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Address</Label>
            <Textarea
              value={configuration.commonData.companyAddress}
              onChange={(e) => handleCommonDataUpdate('companyAddress', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Bill To</Label>
            <Textarea
              value={configuration.commonData.billTo}
              onChange={(e) => handleCommonDataUpdate('billTo', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Invoice Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="flex items-center border rounded-md px-3 py-2 bg-background w-full">
                  <span className="flex-1 text-left">
                    {configuration.commonData.invoiceDate ? new Date(configuration.commonData.invoiceDate).toLocaleDateString() : 'Pick a date'}
                  </span>
                  <CalendarIcon className="h-5 w-5 text-muted-foreground ml-2" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={configuration.commonData.invoiceDate ? new Date(configuration.commonData.invoiceDate) : undefined}
                  onSelect={date => handleCommonDataUpdate('invoiceDate', date ? date.toISOString().split('T')[0] : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Input
              value={configuration.commonData.paymentTerms}
              onChange={(e) => handleCommonDataUpdate('paymentTerms', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={configuration.commonData.phoneNumber}
              onChange={(e) => handleCommonDataUpdate('phoneNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Billing Period</Label>
            <Input
              value={configuration.commonData.billingPeriod}
              onChange={(e) => handleCommonDataUpdate('billingPeriod', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Template-specific content */}
      {templateConfig && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{templateConfig.name}</h3>
            <Badge variant="secondary">{templateConfig.description}</Badge>
          </div>

          {/* Template 7 - Dual tables */}
          {configuration.template === 'template7' && Array.isArray(templateData.mainTable) ? (
            <div className="space-y-6">
              {renderTemplateTable(
                templateData.mainTable, 
                templateConfig.headers, 
                'mainTable', 
                'Main Work Table'
              )}
              {renderTemplateTable(
                templateData.productionSupport, 
                templateConfig.headers, 
                'productionSupport', 
                'Production Support Table'
              )}
            </div>
          ) : (
            /* Single table templates */
            Array.isArray(templateData) && renderTemplateTable(templateData, templateConfig.headers)
          )}

          {/* Template 6 - Additional fields */}
          {configuration.template === 'template6' && configuration.templateData.template6 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Future Account Credits</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Previous Month Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={configuration.templateData.template6.additional.futureAccountCreditPreviousMonth}
                    onChange={(e) => handleTemplate6AdditionalUpdate('futureAccountCreditPreviousMonth', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Month Credit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={configuration.templateData.template6.additional.futureAccountCreditCurrentMonth}
                    onChange={(e) => handleTemplate6AdditionalUpdate('futureAccountCreditCurrentMonth', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End of Month Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={configuration.templateData.template6.additional.futureAccountCreditEndOfMonth}
                    onChange={(e) => handleTemplate6AdditionalUpdate('futureAccountCreditEndOfMonth', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Totals */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Invoice Totals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {configuration.totals.tableSpecificTotals && (
                  <>
                    {configuration.totals.tableSpecificTotals.mainTable !== undefined && (
                      <div className="flex justify-between">
                        <span>Main Table Total:</span>
                        <span className="font-semibold">
                          ${configuration.totals.tableSpecificTotals.mainTable.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {configuration.totals.tableSpecificTotals.productionSupport !== undefined && (
                      <div className="flex justify-between">
                        <span>Production Support Total:</span>
                        <span className="font-semibold">
                          ${configuration.totals.tableSpecificTotals.productionSupport.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <Separator />
                  </>
                )}
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${configuration.totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span className="font-semibold">${configuration.totals.tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${configuration.totals.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplateEditor;