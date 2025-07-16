import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  InvoiceSection, 
  StandardHoursData, 
  OvertimeHoursData,
  ServicesData,
  LicensesData,
  ProductionSupportData,
  WeeklyWorkingHoursData
} from '../../types/invoice';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Calculator
} from 'lucide-react';

interface InvoiceSectionComponentProps {
  section: InvoiceSection;
  onDataUpdate: (sectionId: string, data: any[]) => void;
  onRemoveSection: (sectionId: string) => void;
}

const InvoiceSectionComponent: React.FC<InvoiceSectionComponentProps> = ({
  section,
  onDataUpdate,
  onRemoveSection
}) => {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  const handleAddRow = () => {
    const newRow = createEmptyRow(section.type);
    const updatedData = [...section.data, newRow];
    onDataUpdate(section.id, updatedData);
  };

  const handleDeleteRow = (rowId: string) => {
    const updatedData = section.data.filter(item => item.id !== rowId);
    onDataUpdate(section.id, updatedData);
  };

  const handleEditRow = (row: any) => {
    setEditingRowId(row.id);
    setEditingData({ ...row });
  };

  const handleSaveRow = () => {
    const updatedData = section.data.map(item =>
      item.id === editingRowId ? { ...editingData } : item
    );
    onDataUpdate(section.id, updatedData);
    setEditingRowId(null);
    setEditingData({});
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...editingData, [field]: value };
    
    // Auto-calculate amount for hour-based sections
    if ((section.type === 'standardHours' || section.type === 'overtimeHours') && 
        (field === 'rate' || field === 'hoursWorked')) {
      const rate = field === 'rate' ? parseFloat(value) || 0 : updatedData.rate || 0;
      const hours = field === 'hoursWorked' ? parseFloat(value) || 0 : updatedData.hoursWorked || 0;
      updatedData.amount = rate * hours;
    }
    
    setEditingData(updatedData);
  };

  const createEmptyRow = (sectionType: string): any => {
    const baseRow = { id: `row-${Date.now()}-${Math.random()}` };
    
    switch (sectionType) {
      case 'standardHours':
      case 'overtimeHours':
        return {
          ...baseRow,
          name: '',
          project: '',
          role: '',
          rate: 0,
          hoursWorked: 0,
          amount: 0
        };
      case 'weeklyWorkingHours':
      case 'productionSupport':
        return {
          ...baseRow,
          name: '',
          project: '',
          hoursWorked: 0,
          amount: 0
        };
      case 'services':
        return {
          ...baseRow,
          service: '',
          cost: 0
        };
      case 'licenses':
        return {
          ...baseRow,
          licenseName: '',
          cost: 0
        };
      default:
        return baseRow;
    }
  };

  const renderCell = (item: any, field: string, fieldIndex: number) => {
    const isEditing = editingRowId === item.id;
    const value = isEditing ? editingData[field] : item[field];
    
    if (isEditing) {
      const inputType = ['rate', 'hoursWorked', 'amount', 'cost'].includes(field) ? 'number' : 'text';
      const isReadOnly = field === 'amount' && (section.type === 'standardHours' || section.type === 'overtimeHours');
      
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

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{section.name}</CardTitle>
            <Badge variant={section.required ? 'destructive' : 'secondary'} className="text-xs">
              {section.required ? 'Required' : 'Optional'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4" />
              <span>Total: ${section.total.toLocaleString()}</span>
            </div>
            {!section.required && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemoveSection(section.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {section.headers.map((header, index) => (
                    <th key={index} className="text-left p-3 text-sm font-medium">
                      {header}
                    </th>
                  ))}
                  <th className="text-right p-3 text-sm font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {section.data.length === 0 ? (
                  <tr>
                    <td colSpan={section.headers.length + 1} className="p-8 text-center text-muted-foreground">
                      No data available. Click "Add Row" to add entries.
                    </td>
                  </tr>
                ) : (
                  section.data.map((item, rowIndex) => {
                    const isEditing = editingRowId === item.id;
                    const sectionConfig = getSectionFieldMapping(section.type);
                    
                    return (
                      <tr key={item.id} className={`border-t ${isEditing ? 'bg-primary/5' : ''}`}>
                        {sectionConfig.fieldMapping.map((field, fieldIndex) => (
                          <td key={fieldIndex} className="p-3 text-sm">
                            {renderCell(item, field, fieldIndex)}
                          </td>
                        ))}
                        <td className="p-3 text-right">
                          <div className="flex justify-end space-x-1">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSaveRow}
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
                                  onClick={() => handleDeleteRow(item.id)}
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
          
          {/* Add Row Button */}
          <Button
            variant="outline"
            onClick={handleAddRow}
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

// Helper function to get field mapping for each section type
const getSectionFieldMapping = (sectionType: string) => {
  const configs = {
    standardHours: {
      fieldMapping: ['name', 'project', 'role', 'rate', 'hoursWorked', 'amount']
    },
    overtimeHours: {
      fieldMapping: ['name', 'project', 'role', 'rate', 'hoursWorked', 'amount']
    },
    weeklyWorkingHours: {
      fieldMapping: ['name', 'project', 'hoursWorked', 'amount']
    },
    productionSupport: {
      fieldMapping: ['name', 'project', 'hoursWorked', 'amount']
    },
    services: {
      fieldMapping: ['service', 'cost']
    },
    licenses: {
      fieldMapping: ['licenseName', 'cost']
    }
  };
  
  return configs[sectionType as keyof typeof configs] || { fieldMapping: [] };
};

export default InvoiceSectionComponent;