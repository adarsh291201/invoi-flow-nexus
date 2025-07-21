import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { InvoiceTemplate, InvoiceTemplateConfig } from '../../types/invoice';
import { FileText, Clock, DollarSign, Layers, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Eye } from 'lucide-react';

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
  const [previewOpen, setPreviewOpen] = useState<null | string>(null);
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
            // Sample preview data for each template
            const sampleRow = template.headers.reduce((row, header, idx) => {
              row[header] = `Sample ${header}`;
              return row;
            }, {} as Record<string, string>);
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
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                      </div>
                      <button
                        type="button"
                        className="ml-2 p-1 rounded hover:bg-muted"
                        onClick={e => { e.stopPropagation(); setPreviewOpen(template.id); }}
                        title="Preview Template"
                      >
                        <Eye className="h-5 w-5 text-primary" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Headers:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.headers.map(header => (
                            <Badge key={header} variant="secondary" className="text-xs">
                              {header}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {template.hasMultipleTables && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Features:</p>
                          <Badge variant="outline" className="text-xs">
                            Multiple Tables
                          </Badge>
                        </div>
                      )}
                      {template.additionalFields && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Features:</p>
                          <Badge variant="outline" className="text-xs">
                            Additional Fields
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Template Preview Table */}
                <div className="mt-4">
                  <p className="text-xs font-medium mb-1">Preview:</p>
                  <div className="overflow-x-auto rounded border bg-background">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          {template.headers.map(header => (
                            <th key={header} className="p-2 border-b text-left font-semibold">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {template.headers.map(header => (
                            <td key={header} className="p-2 border-b">Sample {header}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Modal for template preview */}
        <Dialog open={!!previewOpen} onOpenChange={() => setPreviewOpen(null)}>
          <DialogContent className="max-w-2xl w-full p-0 bg-white">
            {previewOpen === 'template1' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                {/* Styled HTML/CSS preview for Template 1 */}
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #fbb040 0 40%, #0a2c5a 40% 100%)', padding: 12, display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 24, color: '#fff' }}>paltech</span>
                    </div>
                  </div>
                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>PALTECH INC</div>
                        <div style={{ fontSize: 13, marginBottom: 2 }}>8 THE GREEN, STE R</div>
                        <div style={{ fontSize: 13, marginBottom: 8 }}>DOVER, DE 19901</div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Bill To:</div>
                        <div style={{ fontSize: 13 }}>XXX<br/>XXX<br/>XXX</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ background: '#0a2c5a', color: '#fff', fontWeight: 700, padding: '4px 16px', borderRadius: 2, fontSize: 16, marginBottom: 8 }}>INVOICE<br/><span style={{ fontWeight: 400, fontSize: 12 }}>XXX</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
                      <div>
                        <div style={{ color: '#fbb040', fontWeight: 600 }}>Invoice Date</div>
                        <div>May 31, 2025</div>
                      </div>
                      <div>
                        <div style={{ color: '#fbb040', fontWeight: 600 }}>Payment Terms</div>
                        <div>XX Days</div>
                      </div>
                      <div>
                        <div style={{ color: '#fbb040', fontWeight: 600 }}>PO Ref number</div>
                        <div>XXX</div>
                      </div>
                    </div>
                    <div style={{ color: '#fbb040', fontWeight: 600, marginTop: 16, fontSize: 13 }}>Billing Period: <span style={{ color: '#222' }}>1st May to 31st May 2025</span></div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Name</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Project</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Role</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Hrs work</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Rate</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>John Doe</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Alpha - Migration</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Developer</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>40.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$50.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$2,000.00</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>2</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>3</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>4</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>5</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}></td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <div style={{ background: '#0a2c5a', color: '#fff', fontWeight: 700, padding: '6px 24px', borderRadius: 2, fontSize: 16 }}>
                        Total &nbsp; $2,000.00
                      </div>
                    </div>
                    <div style={{ marginTop: 16, fontSize: 12, color: '#0a2c5a', textAlign: 'right' }}>
                      Email to invoice@pal.tech in case of any queries
                    </div>
                  </div>
                </div>
              </div>
            )}
            {previewOpen === 'template2' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#0a2c5a', color: '#fff', padding: 12, fontWeight: 700, fontSize: 20 }}>Template 2 Preview</div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>This is a placeholder for Template 2 preview.</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Name</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Role</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Hrs work</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Rate</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Jane Smith</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Tech Lead</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>40.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$60.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$2,400.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {previewOpen === 'template3' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#0a2c5a', color: '#fff', padding: 12, fontWeight: 700, fontSize: 20 }}>Template 3 Preview</div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>This is a placeholder for Template 3 preview.</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Description</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Consulting Services</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$1,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {previewOpen === 'template4' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#0a2c5a', color: '#fff', padding: 12, fontWeight: 700, fontSize: 20 }}>Template 4 Preview</div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>This is a placeholder for Template 4 preview.</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Services</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Web Hosting</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$200.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {previewOpen === 'template5' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#0a2c5a', color: '#fff', padding: 12, fontWeight: 700, fontSize: 20 }}>Template 5 Preview</div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>This is a placeholder for Template 5 preview.</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Description</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Project</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Unit</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Development</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Project X</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Hours</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$5,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {previewOpen === 'template6' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#0a2c5a', color: '#fff', padding: 12, fontWeight: 700, fontSize: 20 }}>Template 6 Preview</div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>This is a placeholder for Template 6 preview.</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Name</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Role</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Rate</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Hrs Worked</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Amount</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Future Account Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Alex</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Analyst</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$70.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>40.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$2,800.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$100.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {previewOpen === 'template7' && (
              <div className="p-6" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
                <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#0a2c5a', color: '#fff', padding: 12, fontWeight: 700, fontSize: 20 }}>Template 7 Preview</div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>This is a placeholder for Template 7 preview.</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fbb040', color: '#fff' }}>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>S.No.</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Name</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Role</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Rate</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Hrs Worked</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Amount</th>
                          <th style={{ padding: 6, border: '1px solid #ddd' }}>Production Support</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>1</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Sam</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>Support</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$55.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>40.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$2,200.00</td>
                          <td style={{ padding: 6, border: '1px solid #ddd' }}>$300.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;