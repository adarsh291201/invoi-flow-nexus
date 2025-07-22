import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Building2, 
  FolderOpen, 
  Users, 
  Calculator, 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  Search,
  ChevronDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Link } from 'react-router-dom';
import { Account, Project, Resource } from '../types';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import {
  getRateMatrices,
  createRateMatrices,
  updateRateMatrix,
  deleteRateMatrix,
} from '../services/rateMatrixService';
import { toast } from '../components/ui/use-toast';

const Accounts = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { invoices } = useSelector((state: RootState) => state.invoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [resourceEdits, setResourceEdits] = useState<Record<string, any>>({});
  const [month, setMonth] = useState('June');
  const [year, setYear] = useState(new Date().getFullYear());
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rateMatrices, setRateMatrices] = useState<any[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  useEffect(() => {
    // Mock account data
    const mockAccounts: Account[] = [
      {
        id: 'acc001',
        name: 'Client Alpha Corp',
        projects: [
          {
            id: 'p101',
            name: 'Alpha - Migration',
            accountId: 'acc001',
            resources: [
              { id: 'r1', name: 'John Doe', role: 'Senior Developer', rate: 85, weekendRate: 120, otRate: 110, projectId: 'p101', startDate: '2024-06-01', endDate: '2024-12-31' },
              { id: 'r2', name: 'Jane Smith', role: 'Tech Lead', rate: 95, weekendRate: 140, otRate: 125, projectId: 'p101', startDate: '2024-06-01', endDate: '2024-12-31' },
            ]
          },
          {
            id: 'p102',
            name: 'Alpha - Support',
            accountId: 'acc001',
            resources: [
              { id: 'r3', name: 'Mike Johnson', role: 'Support Engineer', rate: 60, weekendRate: 85, otRate: 75, projectId: 'p102', startDate: '2024-06-01', endDate: '2024-12-31' },
            ]
          }
        ]
      },
      {
        id: 'acc002',
        name: 'Client Beta Solutions',
        projects: [
          {
            id: 'p201',
            name: 'Beta - Development',
            accountId: 'acc002',
            resources: [
              { id: 'r4', name: 'Sarah Wilson', role: 'Full Stack Developer', rate: 80, weekendRate: 115, otRate: 105, projectId: 'p201', startDate: '2024-06-01', endDate: '2024-12-31' },
              { id: 'r5', name: 'David Brown', role: 'DevOps Engineer', rate: 90, weekendRate: 130, otRate: 115, projectId: 'p201', startDate: '2024-06-01', endDate: '2024-12-31' },
            ]
          }
        ]
      },
      {
        id: 'acc003',
        name: 'Client Gamma Industries',
        projects: [
          {
            id: 'p301',
            name: 'Gamma - Consulting',
            accountId: 'acc003',
            resources: [
              { id: 'r6', name: 'Emily Davis', role: 'Senior Consultant', rate: 100, weekendRate: 150, otRate: 130, projectId: 'p301', startDate: '2024-06-01', endDate: '2024-12-31' },
            ]
          }
        ]
      }
    ];
    
    setAccounts(mockAccounts);
  }, []);

  useEffect(() => {
    fetch(`/project/without-invoice?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(setProjects);
  }, [month, year]);

  const handleBulkGenerate = async () => {
    const res = await fetch('/project/bulk-generate-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds: selected, month, year }),
    });
    const data = await res.json();
    // Show results to user (success/failure)
    alert('Bulk invoice generation complete!');
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.projects.some(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getCurrentMonth = () => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const hasInvoiceForCurrentMonth = (projectId: string) => {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    return invoices.some(
      inv => inv.projectId === projectId &&
        inv.month === currentMonth &&
        Number(inv.year) === currentYear
    );
  };

  const getTotalProjectResources = (project: Project) => {
    return project.resources.length;
  };

  const getAverageRate = (project: Project) => {
    if (project.resources.length === 0) return 0;
    const total = project.resources.reduce((sum, resource) => sum + resource.rate, 0);
    return Math.round(total / project.resources.length);
  };

  const handleResourceChange = (resourceId: string, field: string, value: any) => {
    setResourceEdits(prev => ({
      ...prev,
      [resourceId]: {
        ...prev[resourceId],
        [field]: value
      }
    }));
  };

  // Fetch rate matrix for selected project
  const fetchRateMatrix = async (projectId: string) => {
    setLoadingMatrix(true);
    try {
      const data = await getRateMatrices(projectId);
      setRateMatrices(data);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch rate matrix', variant: 'destructive' });
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Save rate matrix (bulk)
  const handleSaveResourceRates = async (payload: any[]) => {
    setLoadingMatrix(true);
    try {
      await createRateMatrices(payload);
      toast({ title: 'Success', description: 'Rate matrix saved', variant: 'success' });
      // Optionally refetch
      if (payload[0]?.projectId) fetchRateMatrix(payload[0].projectId);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save rate matrix', variant: 'destructive' });
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Update a single rate matrix
  const handleUpdateRateMatrix = async (id: number, matrix: any) => {
    setLoadingMatrix(true);
    try {
      await updateRateMatrix(id, matrix);
      toast({ title: 'Success', description: 'Rate matrix updated', variant: 'success' });
      fetchRateMatrix(matrix.projectId);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update rate matrix', variant: 'destructive' });
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Delete a rate matrix
  const handleDeleteRateMatrix = async (id: number, projectId: string) => {
    setLoadingMatrix(true);
    try {
      await deleteRateMatrix(id);
      toast({ title: 'Success', description: 'Rate matrix deleted', variant: 'success' });
      fetchRateMatrix(projectId);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete rate matrix', variant: 'destructive' });
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Validation: check if all required fields are filled for all resources
  const isMatrixValid = (resources: Resource[]) => {
    return resources.every(resource => {
      const edit = resourceEdits[resource.id] || {};
      const rate = edit.rate ?? resource.rate;
      const weekendRate = edit.weekendRate ?? resource.weekendRate;
      const otRate = edit.otRate ?? resource.otRate;
      const startDate = edit.startDate ?? resource.startDate;
      const endDate = edit.endDate ?? resource.endDate;
      return rate && weekendRate && otRate && startDate && endDate;
    });
  };

  // Build payload for API
  const buildRateMatrixPayload = (resources: Resource[], project: Project, account: Account) => {
    return resources.map(resource => {
      const edit = resourceEdits[resource.id] || {};
      // Convert resource.id to a number if it's a string like 'r3'
      let resourceIdNum = typeof resource.id === 'number' ? resource.id : parseInt(String(resource.id).replace(/\D/g, ''), 10);
      return {
        id: typeof resource.id === 'number' ? resource.id : 0, // 0 for new, or use actual number if editing
        projectId: project.id,
        projectName: project.name,
        accountId: account.id,
        accountName: account.name,
        resourceId: resourceIdNum,
        resourceName: resource.name,
        startDate: edit.startDate ?? resource.startDate,
        endDate: edit.endDate ?? resource.endDate,
        standardRate: edit.rate ?? resource.rate,
        weekendRate: edit.weekendRate ?? resource.weekendRate,
        otRate: edit.otRate ?? resource.otRate,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight headline-blue">Accounts</h1>
          <p className="text-muted-foreground">
            Manage client accounts, projects, and resource rates
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-4">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="shadow-card">
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{account.name}</CardTitle>
                    <CardDescription>
                      {account.projects.length} project{account.projects.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center">
                  <ChevronDown
                    className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${expandedAccount === account.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </CardHeader>

            {expandedAccount === account.id && (
              <CardContent>
                <div className="space-y-6">
                  {account.projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{project.name}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {getTotalProjectResources(project)} resources
                            </span>
                            <span className="flex items-center">
                              <Calculator className="h-4 w-4 mr-1" />
                              Avg rate: ${getAverageRate(project)}/hr
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {hasInvoiceForCurrentMonth(project.id) ? (
                            <>
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/invoice/preview/${project.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </>
                          ) : (
                            user?.role === 'L1' && (
                              <Button size="sm" variant="blue" className="" asChild>
                                <Link to={`/invoice/generate?project=${project.id}`}>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Invoice for {getCurrentMonth()}
                                </Link>
                              </Button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Resources Table */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-3">Resource Rate Matrix</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Resource</th>
                                <th className="text-left p-2">Role</th>
                                <th className="text-left p-2">Standard Rate</th>
                                <th className="text-left p-2">Weekend Rate</th>
                                <th className="text-left p-2">OT Rate</th>
                                <th className="text-left p-2">Start Date</th>
                                <th className="text-left p-2">End Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {project.resources.map((resource) => {
                                const isEditable = user?.role === 'L1' || user?.role === 'Admin';
                                const edit = resourceEdits[resource.id] || {};
                                return (
                                  <tr key={resource.id} className="border-b">
                                    <td className="p-2 font-medium">{resource.name}</td>
                                    <td className="p-2">
                                      <Badge variant="secondary">{resource.role}</Badge>
                                    </td>
                                    <td className="p-2">
                                      {isEditable ? (
                                        <Input
                                          type="number"
                                          value={edit.rate ?? resource.rate}
                                          onChange={e => handleResourceChange(resource.id, 'rate', e.target.value)}
                                          className="w-24"
                                        />
                                      ) : (
                                        <>${resource.rate}/hr</>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditable ? (
                                        <Input
                                          type="number"
                                          value={edit.weekendRate ?? resource.weekendRate}
                                          onChange={e => handleResourceChange(resource.id, 'weekendRate', e.target.value)}
                                          className="w-24"
                                        />
                                      ) : (
                                        <>${resource.weekendRate}/hr</>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditable ? (
                                        <Input
                                          type="number"
                                          value={edit.otRate ?? resource.otRate}
                                          onChange={e => handleResourceChange(resource.id, 'otRate', e.target.value)}
                                          className="w-24"
                                        />
                                      ) : (
                                        <>${resource.otRate}/hr</>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditable ? (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button type="button" className="flex items-center border rounded-md px-3 py-2 bg-background w-full">
                                              <span className="flex-1 text-left">
                                                {edit.startDate ?? resource.startDate ? new Date(edit.startDate ?? resource.startDate).toLocaleDateString() : 'Pick a date'}
                                              </span>
                                              <CalendarIcon className="h-5 w-5 text-muted-foreground ml-2" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={edit.startDate ?? resource.startDate ? new Date(edit.startDate ?? resource.startDate) : undefined}
                                              onSelect={date => date && handleResourceChange(resource.id, 'startDate', date.toISOString().split('T')[0])}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <>{resource.startDate ? new Date(resource.startDate).toLocaleDateString() : '-'}</>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditable ? (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button type="button" className="flex items-center border rounded-md px-3 py-2 bg-background w-full">
                                              <span className="flex-1 text-left">
                                                {edit.endDate ?? resource.endDate ? new Date(edit.endDate ?? resource.endDate).toLocaleDateString() : 'Pick a date'}
                                              </span>
                                              <CalendarIcon className="h-5 w-5 text-muted-foreground ml-2" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={edit.endDate ?? resource.endDate ? new Date(edit.endDate ?? resource.endDate) : undefined}
                                              onSelect={date => date && handleResourceChange(resource.id, 'endDate', date.toISOString().split('T')[0])}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <>{resource.endDate ? new Date(resource.endDate).toLocaleDateString() : '-'}</>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {(user?.role === 'L1' || user?.role === 'Admin') && (
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                variant="blue"
                                onClick={() => {
                                  const payload = buildRateMatrixPayload(project.resources, project, account);
                                  handleSaveResourceRates(payload);
                                  // You can use 'payload' for your API call later
                                }}
                                disabled={!isMatrixValid(project.resources) || loadingMatrix}
                              >
                                {loadingMatrix ? 'Saving...' : 'Save Rate Matrix'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Previous Invoices */}
                      <div>
                        <h4 className="font-medium mb-3">Previous Invoices</h4>
                        <div className="space-y-2">
                          {/* Mock previous invoices */}
                          {[
                            { month: 'May 2025', template: 'Standard Template', status: 'Dispatched' },
                            { month: 'April 2025', template: 'Detailed Template', status: 'Dispatched' },
                            { month: 'March 2025', template: 'Standard Template', status: 'Dispatched' },
                          ].map((invoice, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{invoice.month}</span>
                                <Badge variant="outline" className="text-xs">
                                  {invoice.template}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={invoice.status === 'Dispatched' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {invoice.status}
                                </Badge>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
            <p className="text-muted-foreground">
              No accounts match your search criteria. Try adjusting your search terms.
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <label>
          Month:
          <select value={month} onChange={e => setMonth(e.target.value)}>
            {/* Add month options here */}
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
        </label>
        <label>
          Year:
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selected.length === projects.length}
                onChange={e => setSelected(e.target.checked ? projects.map((p: any) => p.id) : [])}
              />
            </th>
            <th>Project Name</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project: any) => (
            <tr key={project.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(project.id)}
                  onChange={e =>
                    setSelected(sel =>
                      e.target.checked
                        ? [...sel, project.id]
                        : sel.filter(id => id !== project.id)
                    )
                  }
                />
              </td>
              <td>{project.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleBulkGenerate} disabled={selected.length === 0}>
        Generate Invoices
      </button>
    </div>
  );
};

export default Accounts;