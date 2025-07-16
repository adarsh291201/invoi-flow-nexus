import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { InvoiceSectionType, InvoiceTemplateConfig } from '../../types/invoice';
import { 
  Clock, 
  Timer, 
  Calendar, 
  Wrench, 
  Package, 
  Key,
  Info
} from 'lucide-react';

interface SectionSelectorProps {
  selectedTemplate: InvoiceTemplateConfig | null;
  selectedSections: InvoiceSectionType[];
  availableData: Record<InvoiceSectionType, any[]>;
  onSectionToggle: (section: InvoiceSectionType, enabled: boolean) => void;
}

const sectionConfig = {
  standardHours: {
    icon: Clock,
    label: 'Standard Working Hours',
    description: 'Regular working hours at standard rates'
  },
  overtimeHours: {
    icon: Timer,
    label: 'Overtime Hours', 
    description: 'Extended hours at overtime rates'
  },
  weeklyWorkingHours: {
    icon: Calendar,
    label: 'Weekly Working Hours',
    description: 'Weekly aggregated hours'
  },
  productionSupport: {
    icon: Wrench,
    label: 'Production Support Hours',
    description: 'Support and maintenance hours'
  },
  services: {
    icon: Package,
    label: 'Services',
    description: 'Fixed-price services and deliverables'
  },
  licenses: {
    icon: Key,
    label: 'Licenses/Subscription Costs',
    description: 'Software licenses and subscriptions'
  }
} as const;

const SectionSelector: React.FC<SectionSelectorProps> = ({
  selectedTemplate,
  selectedSections,
  availableData,
  onSectionToggle
}) => {
  const getSectionStatus = (sectionType: InvoiceSectionType) => {
    const isRequired = selectedTemplate?.requiredSections.includes(sectionType);
    const isDefault = selectedTemplate?.defaultSections.includes(sectionType);
    const hasData = availableData[sectionType]?.length > 0;
    const isSelected = selectedSections.includes(sectionType);

    return {
      isRequired,
      isDefault,
      hasData,
      isSelected
    };
  };

  if (!selectedTemplate) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Template First</h3>
          <p className="text-muted-foreground">
            Please select an invoice template to configure sections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Step 2: Configure Invoice Sections</CardTitle>
        <CardDescription>
          Choose which sections to include in your invoice. Sections with data are automatically selected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(sectionConfig).map(([sectionType, config]) => {
            const { isRequired, isDefault, hasData, isSelected } = getSectionStatus(sectionType as InvoiceSectionType);
            const IconComponent = config.icon;
            const dataCount = availableData[sectionType as InvoiceSectionType]?.length || 0;
            
            return (
              <div
                key={sectionType}
                className={`border rounded-lg p-4 transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center pt-1">
                    <Checkbox
                      checked={isSelected}
                      disabled={isRequired}
                      onCheckedChange={(checked) => 
                        onSectionToggle(sectionType as InvoiceSectionType, checked as boolean)
                      }
                    />
                  </div>
                  
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                    <IconComponent className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">{config.label}</h4>
                      <div className="flex space-x-1">
                        {isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {isDefault && !isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {hasData && (
                          <Badge variant="outline" className="text-xs">
                            {dataCount} item{dataCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                    
                    {hasData && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <span className="font-medium">Available data:</span> {dataCount} entries ready to import
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium text-sm mb-2">Section Summary</h5>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Selected sections: {selectedSections.length}</p>
            <p>• Required sections: {selectedTemplate.requiredSections.length}</p>
            <p>• Sections with data: {Object.values(availableData).filter(data => data.length > 0).length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionSelector;