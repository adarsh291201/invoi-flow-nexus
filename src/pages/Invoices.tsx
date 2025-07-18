import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setInvoices, setFilters, updateInvoiceStatus } from '../store/slices/invoiceSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import StatusBadge from '../components/StatusBadge';
import { Eye, MessageSquare, Check, X, Filter, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Invoice, InvoiceStatus } from '../types';
import { useToast } from '../hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '../components/ui/drawer';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import { Checkbox } from '../components/ui/checkbox';
import { Filter as FilterIcon } from 'lucide-react';

function FilterSection({
  col,
  label,
  options,
  selected,
  onChange,
}: {
  col: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const allChecked = selected.length === options.length && options.length > 0;
  // const someChecked = selected.length > 0 && selected.length < options.length; // no longer needed
  return (
    <AccordionItem value={col} key={col}>
      <AccordionTrigger>{label}</AccordionTrigger>
      <AccordionContent>
        {/* All Checkbox (no indeterminate state) */}
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            checked={allChecked}
            onCheckedChange={checked => {
              onChange(checked ? [...options] : []);
            }}
            id={`filter-${col}-all`}
          />
          <label htmlFor={`filter-${col}-all`}>All</label>
        </div>
        {/* Individual Options */}
        {options.map(val => (
          <div key={val} className="flex items-center space-x-2 mb-2">
            <Checkbox
              checked={selected.includes(val)}
              onCheckedChange={checked => {
                onChange(
                  checked
                    ? [...selected, val]
                    : selected.filter(v => v !== val)
                );
              }}
              id={`filter-${col}-${val}`}
            />
            <label htmlFor={`filter-${col}-${val}`}>{val}</label>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

const Invoices = () => {
  const { invoices, filters } = useSelector((state: RootState) => state.invoices);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  // Helper: Get visible columns and their unique values from invoices
  const columnLabels = {
    id: 'Invoice ID',
    project: 'Project',
    client: 'Client',
    status: 'Status',
    amount: 'Amount',
    month: 'Month',
    year: 'Year',
    createdBy: 'Created By',
    createdAt: 'Created At',
    dueDate: 'Due Date',
  };
  const visibleColumns = ['status', 'project', 'client', 'month']; // Add/remove as needed

  // Build unique values for each column
  const columnFilterValues: Record<string, string[]> = {};
  visibleColumns.forEach(col => {
    columnFilterValues[col] = Array.from(new Set(invoices.map(inv => String(inv[col])))).filter(Boolean);
  });

  // State for dynamic filters
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Mock invoice data
    const mockInvoices: Invoice[] = [
      // {
      //   id: 'inv001',
      //   project: 'Alpha - Migration',
      //   projectId: 'p101',
      //   client: 'Client Alpha',
      //   status: 'Pending L2',
      //   amount: 12500,
      //   month: 'June',
      //   year: 2025,
      //   createdBy: 'Alice Johnson',
      //   createdAt: '2025-06-01T10:00:00Z',
      //   dueDate: '2025-06-15T00:00:00Z',
      //   history: [
      //     { id: '1', action: 'Generated', by: 'Alice Johnson', byId: 'u1', date: '2025-06-01T10:00:00Z' },
      //   ],
      // },
      {
        id: 'inv002',
        project: 'Beta - Development',
        projectId: 'p102',
        client: 'Client Beta',
        status: 'Approved',
        amount: 8750,
        month: 'June',
        year: 2025,
        createdBy: 'Alice Johnson',
        createdAt: '2025-06-02T14:30:00Z',
        dueDate: '2025-06-17T00:00:00Z',
        history: [
          { id: '1', action: 'Generated', by: 'Alice Johnson', byId: 'u1', date: '2025-06-02T14:30:00Z' },
          { id: '2', action: 'Approved by L2', by: 'Bob Smith', byId: 'u2', date: '2025-06-03T09:15:00Z' },
          { id: '3', action: 'Approved by L3', by: 'Claire Wilson', byId: 'u3', date: '2025-06-03T16:45:00Z' },
        ],
      },
      {
        id: 'inv003',
        project: 'Gamma - Consulting',
        projectId: 'p103',
        client: 'Client Gamma',
        status: 'Draft',
        amount: 15600,
        month: 'June',
        year: 2025,
        createdBy: 'Alice Johnson',
        createdAt: '2025-06-05T11:20:00Z',
        dueDate: '2025-06-20T00:00:00Z',
        history: [
          { id: '1', action: 'Created as Draft', by: 'Alice Johnson', byId: 'u1', date: '2025-06-05T11:20:00Z' },
        ],
      },
      {
        id: 'inv004',
        project: 'Delta - Support',
        projectId: 'p104',
        client: 'Client Delta',
        status: 'Pending L3',
        amount: 9200,
        month: 'May',
        year: 2025,
        createdBy: 'Alice Johnson',
        createdAt: '2025-05-28T16:00:00Z',
        dueDate: '2025-06-12T00:00:00Z',
        history: [
          { id: '1', action: 'Generated', by: 'Alice Johnson', byId: 'u1', date: '2025-05-28T16:00:00Z' },
          { id: '2', action: 'Approved by L2', by: 'Bob Smith', byId: 'u2', date: '2025-05-30T10:30:00Z', comment: 'Looks good, approved for final review' },
        ],
      },
    ];
    
    dispatch(setInvoices(mockInvoices));
  }, [dispatch]);

  const filteredInvoices = invoices.filter(invoice => {
    // Dynamic filter logic
    for (const col of visibleColumns) {
      if (selectedFilters[col] && selectedFilters[col].length > 0) {
        if (!selectedFilters[col].includes(String(invoice[col]))) return false;
      }
    }
    if (keyword && !(
      invoice.project.toLowerCase().includes(keyword.toLowerCase()) ||
      invoice.client.toLowerCase().includes(keyword.toLowerCase()) ||
      invoice.id.toLowerCase().includes(keyword.toLowerCase())
    )) return false;
    return true;
  });

  const handleStatusUpdate = (invoiceId: string, newStatus: InvoiceStatus, comment?: string) => {
    dispatch(updateInvoiceStatus({ id: invoiceId, status: newStatus, comment }));
    toast({
      title: "Status Updated",
      description: `Invoice ${invoiceId} status changed to ${newStatus}`,
    });
  };

  const canApprove = (invoice: Invoice) => {
    if (user?.role === 'L2' && invoice.status === 'Pending L2') return true;
    if (user?.role === 'L3' && invoice.status === 'Pending L3') return true;
    return false;
  };

  const canReject = (invoice: Invoice) => {
    if (user?.role === 'L2' && invoice.status === 'Pending L2') return true;
    if (user?.role === 'L3' && invoice.status === 'Pending L3') return true;
    return false;
  };

  const getNextApprovalStatus = (currentStatus: InvoiceStatus): InvoiceStatus => {
    if (currentStatus === 'Pending L2') return 'Pending L3';
    if (currentStatus === 'Pending L3') return 'Approved';
    return currentStatus;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage and track all your invoices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2 mr-4">
            <button
              className={`px-4 py-2 rounded font-medium transition-colors border ${viewMode === 'table' ? 'bg-[rgb(6,65,115)] text-white border-[rgb(6,65,115)]' : 'bg-white text-[rgb(6,65,115)] border-[rgb(6,65,115)]'}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              className={`px-4 py-2 rounded font-medium transition-colors border ${viewMode === 'cards' ? 'bg-[rgb(6,65,115)] text-white border-[rgb(6,65,115)]' : 'bg-white text-[rgb(6,65,115)] border-[rgb(6,65,115)]'}`}
              onClick={() => setViewMode('cards')}
            >
              Card View
            </button>
          </div>
          {user?.role === 'L1' && (
            <Button asChild variant="blue">
              <Link to="/invoice/generate">Generate Invoice</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters Button */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search invoices..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-64"
        />
        <Button variant="outline" onClick={() => setDrawerOpen(true)}>
          <Filter className="mr-2" /> Filters
        </Button>
      </div>

      {/* Drawer Filter Panel */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="right-0 left-auto w-full max-w-sm fixed top-4 rounded-xl shadow-lg border bg-white p-0 max-h-[80vh] flex flex-col">
          {/* Scrollable content area (search + filters) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-0">
            {/* Search bar with icon */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FilterIcon className="w-4 h-4" />
              </span>
              <Input
                placeholder="Filter by Keyword"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring w-full"
              />
            </div>
            <Accordion type="multiple" className="mb-4">
              {visibleColumns.map(col => (
                <FilterSection
                  key={col}
                  col={col}
                  label={columnLabels[col] || col}
                  options={columnFilterValues[col]}
                  selected={selectedFilters[col] || []}
                  onChange={vals => setSelectedFilters(prev => ({ ...prev, [col]: vals }))}
                />
              ))}
            </Accordion>
          </div>
          {/* Sticky Footer for buttons */}
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-white border-t flex justify-end items-center gap-2 pt-4 pb-2 px-4 rounded-b-xl">
            <button
              className="text-primary px-3 py-1 rounded hover:underline focus:outline-none"
              onClick={() => {
                setSelectedFilters({});
                setKeyword('');
              }}
              type="button"
            >
              Reset
            </button>
            <button
              className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary/90 focus:outline-none"
              onClick={() => setDrawerOpen(false)}
              type="button"
            >
              Apply
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Invoices Display */}
      {viewMode === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{invoice.project}</CardTitle>
                    <CardDescription>{invoice.client}</CardDescription>
                  </div>
                  <StatusBadge status={invoice.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-semibold">${invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Period:</span>
                    <span>{invoice.month} {invoice.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created by:</span>
                    <span className="text-sm">{invoice.createdBy}</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/invoice/${invoice.id}/preview`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Link>
                    </Button>
                    
                    {canApprove(invoice) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-status-approved border-status-approved hover:bg-status-approved hover:text-success-foreground"
                        onClick={() => handleStatusUpdate(invoice.id, getNextApprovalStatus(invoice.status))}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    
                    {canReject(invoice) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-status-rejected border-status-rejected hover:bg-status-rejected hover:text-destructive-foreground"
                        onClick={() => handleStatusUpdate(invoice.id, 'Rejected', 'Rejected via quick action')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4">Invoice ID</th>
                    <th className="text-left p-4">Project</th>
                    <th className="text-left p-4">Client</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Period</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-mono text-sm">{invoice.id}</td>
                      <td className="p-4">{invoice.project}</td>
                      <td className="p-4">{invoice.client}</td>
                      <td className="p-4 font-semibold">${invoice.amount.toLocaleString()}</td>
                      <td className="p-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="p-4">{invoice.month} {invoice.year}</td>
                      <td className="p-4">
                        <div className="flex space-x-1">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/invoice/${invoice.id}/preview`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canApprove(invoice) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-status-approved"
                              onClick={() => handleStatusUpdate(invoice.id, getNextApprovalStatus(invoice.status))}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {canReject(invoice) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-status-rejected"
                              onClick={() => handleStatusUpdate(invoice.id, 'Rejected', 'Rejected via quick action')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredInvoices.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-4">
              No invoices match your current filters. Try adjusting the filters or create a new invoice.
            </p>
            {user?.role === 'L1' && (
              <Button asChild className="bg-gradient-primary">
                <Link to="/invoice/generate">Generate Your First Invoice</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Invoices;