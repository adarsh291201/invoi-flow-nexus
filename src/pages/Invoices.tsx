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
import { Eye, MessageSquare, Check, X, Filter, FileText, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
import { InvoiceDataService } from '../services/invoiceDataService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // New state for table functionality
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    console.log('Fetching invoices from backend...');
    InvoiceDataService.fetchAllInvoices()
      .then(data => {
        console.log('Fetched invoices:', data);
        dispatch(setInvoices(data));
      })
      .catch(e => {
        console.error('Failed to fetch invoices', e);
      });
  }, [dispatch]);

  // Map backend invoices to UI-friendly format
  const mappedInvoices = invoices.map((inv: any) => {
    let totals = {};
    try { totals = JSON.parse(inv.totalsJson || '{}'); } catch {}
    return {
      ...inv,
      amount: (totals as any).total || 0,
    };
  });

  // Apply filters and sorting
  const filteredInvoices = mappedInvoices.filter(invoice => {
    const matchesKeyword = keyword === '' || 
      invoice.invoiceConfigId?.toLowerCase().includes(keyword.toLowerCase()) ||
      invoice.projectId?.toLowerCase().includes(keyword.toLowerCase()) ||
      invoice.accountId?.toLowerCase().includes(keyword.toLowerCase()) ||
      invoice.status?.toLowerCase().includes(keyword.toLowerCase());

    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(invoice.status);
    const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(invoice.accountId || '');
    const matchesGrade = selectedGrades.length === 0 || selectedGrades.includes(invoice.projectId || '');

    return matchesKeyword && matchesStatus && matchesDepartment && matchesGrade;
  }).sort((a, b) => {
    let aValue: any = a[sortColumn as keyof typeof a];
    let bValue: any = b[sortColumn as keyof typeof b];

    // Handle special cases
    if (sortColumn === 'amount') {
      aValue = typeof aValue === 'number' ? aValue : 0;
      bValue = typeof bValue === 'number' ? bValue : 0;
    } else if (sortColumn === 'createdAt') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const handleStatusUpdate = (invoiceId: string, newStatus: InvoiceStatus, comment?: string) => {
    dispatch(updateInvoiceStatus({ id: invoiceId, status: newStatus, comment }));
    toast({
      title: "Status Updated",
      description: `Invoice ${invoiceId} status changed to ${newStatus}`,
    });
  };

  const canApprove = (invoice: Invoice) => {
    if (user?.role === 'L1' && invoice.status === 'L1 Pending') return true;
    if (user?.role === 'L2' && invoice.status === 'L2 Pending') return true;
    if (user?.role === 'L3' && invoice.status === 'L3 Pending') return true;
    return false;
  };

  const canReject = (invoice: Invoice) => {
    if (user?.role === 'L1' && invoice.status === 'L1 Pending') return true;
    if (user?.role === 'L2' && invoice.status === 'L2 Pending') return true;
    if (user?.role === 'L3' && invoice.status === 'L3 Pending') return true;
    return false;
  };

  const getNextApprovalStatus = (currentStatus: InvoiceStatus): InvoiceStatus => {
    switch (currentStatus) {
      case 'L1 Pending': return 'L2 Pending';
      case 'L2 Pending': return 'L3 Pending';
      case 'L3 Pending': return 'Ready for Dispatch';
      default: return currentStatus;
    }
  };

  // Sorting function
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(paginatedInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  // Pagination functions
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreview = async (invoiceId: string) => {
    try {
      const response = await fetch(`/invoice/${invoiceId}/download`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      previewUrlRef.current = url;
      setPreviewOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not load PDF preview.' });
    }
  };

  // Clean up object URL when modal closes
  useEffect(() => {
    if (!previewOpen && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
  }, [previewOpen]);

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
          {mappedInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate(`/invoice/${invoice.invoiceConfigId}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{invoice.projectId || '-'}</CardTitle>
                    <CardDescription>{invoice.accountId || '-'}</CardDescription>
                  </div>
                  <StatusBadge status={invoice.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-semibold">{typeof invoice.amount === 'number' ? `$${invoice.amount.toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Period:</span>
                    <span>{invoice.month} {invoice.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created at:</span>
                    <span className="text-sm">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/invoice/${invoice.invoiceConfigId}/preview`}>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ border: `1px solid rgb(6, 65, 115, 0.3)` }}>
              <thead>
                <tr style={{ backgroundColor: 'rgb(6, 65, 115)' }}>
                  <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="mr-2"
                      />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('invoiceConfigId')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      INVOICE ID
                      {getSortIcon('invoiceConfigId')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('projectId')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      PROJECT
                      {getSortIcon('projectId')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('accountId')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      CLIENT
                      {getSortIcon('accountId')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('amount')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      AMOUNT
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('status')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      STATUS
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('month')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      PERIOD
                      {getSortIcon('month')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-white font-semibold cursor-pointer transition-colors" 
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    onClick={() => handleSort('createdAt')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(4, 50, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(6, 65, 115)'}
                  >
                    <div className="flex items-center justify-between">
                      CREATED DATE
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoice/${invoice.invoiceConfigId}`)}
                    style={{ borderColor: 'rgb(6, 65, 115, 0.2)' }}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-4 font-mono text-sm font-medium text-gray-900">{invoice.invoiceConfigId}</td>
                    <td className="p-4 font-medium text-gray-900">{invoice.projectId || '-'}</td>
                    <td className="p-4 font-medium text-gray-900">{invoice.accountId || '-'}</td>
                    <td className="p-4 font-semibold text-gray-900">
                      ${typeof invoice.amount === 'number' ? invoice.amount.toLocaleString() : '-'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-4 font-medium text-gray-900">{invoice.month} {invoice.year}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === pageNum 
                          ? 'bg-[rgb(6,65,115)] text-white border-[rgb(6,65,115)]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === totalPages 
                          ? 'bg-[rgb(6,65,115)] text-white border-[rgb(6,65,115)]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Total Row Count: {filteredInvoices.length}</span>
              <span>Page Size</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
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