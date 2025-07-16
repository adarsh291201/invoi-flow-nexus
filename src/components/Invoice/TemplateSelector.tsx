import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { InvoiceTemplate, InvoiceTemplateConfig } from '../../types/invoice';
import { FileText, Clock, DollarSign, Layers, Check } from 'lucide-react';

interface TemplateSelectorProps {
  templates: InvoiceTemplateConfig[];
  selectedTemplate: InvoiceTemplate | null;
  onTemplateSelect: (template: InvoiceTemplate) => void;
}

const iconMap = {
  FileText,
  Clock,
  DollarSign,
  Layers
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect
}) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Step 1: Select Invoice Template</CardTitle>
        <CardDescription>
          Choose the template that best fits your billing structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const IconComponent = iconMap[template.icon as keyof typeof iconMap] || FileText;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <div
                key={template.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onTemplateSelect(template.id)}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                    <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Default Sections:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.defaultSections.map(section => (
                            <Badge key={section} variant="secondary" className="text-xs">
                              {section.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {template.requiredSections.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Required:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.requiredSections.map(section => (
                              <Badge key={section} variant="outline" className="text-xs">
                                {section.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;