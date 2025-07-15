import { useEffect, useState } from 'react';
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

const Invoices = () => {
  const { invoices, filters } = useSelector((state: RootState) => state.invoices);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  useEffect(() => {
    // Mock invoice data
    const mockInvoices: Invoice[] = [
      {
        id: 'inv001',
        project: 'Alpha - Migration',
        projectId: 'p101',
        client: 'Client Alpha',
        status: 'Pending L2',
        amount: 12500,
        month: 'June',
        year: 2025,
        createdBy: 'Alice Johnson',
        createdAt: '2025-06-01T10:00:00Z',
        dueDate: '2025-06-15T00:00:00Z',
        history: [
          { id: '1', action: 'Generated', by: 'Alice Johnson', byId: 'u1', date: '2025-06-01T10:00:00Z' },
        ],
      },
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
    if (filters.status !== 'All' && invoice.status !== filters.status) return false;
    if (filters.month && invoice.month !== filters.month) return false;
    if (filters.project && !invoice.project.toLowerCase().includes(filters.project.toLowerCase())) return false;
    if (filters.client && !invoice.client.toLowerCase().includes(filters.client.toLowerCase())) return false;
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
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
            {viewMode === 'table' ? 'Card View' : 'Table View'}
          </Button>
          {user?.role === 'L1' && (
            <Button asChild className="bg-gradient-primary">
              <Link to="/invoice/generate">Generate Invoice</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={filters.status} onValueChange={(value) => dispatch(setFilters({ status: value as InvoiceStatus | 'All' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending L2">Pending L2</SelectItem>
                  <SelectItem value="Pending L3">Pending L3</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="Filter by project..."
                value={filters.project}
                onChange={(e) => dispatch(setFilters({ project: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="Filter by client..."
                value={filters.client}
                onChange={(e) => dispatch(setFilters({ client: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="Filter by month..."
                value={filters.month}
                onChange={(e) => dispatch(setFilters({ month: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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