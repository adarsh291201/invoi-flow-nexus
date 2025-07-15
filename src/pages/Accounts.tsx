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
  Search 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Account, Project, Resource } from '../types';

const Accounts = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

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
              { id: 'r1', name: 'John Doe', role: 'Senior Developer', rate: 85, weekendRate: 120, otRate: 110, projectId: 'p101' },
              { id: 'r2', name: 'Jane Smith', role: 'Tech Lead', rate: 95, weekendRate: 140, otRate: 125, projectId: 'p101' },
            ]
          },
          {
            id: 'p102',
            name: 'Alpha - Support',
            accountId: 'acc001',
            resources: [
              { id: 'r3', name: 'Mike Johnson', role: 'Support Engineer', rate: 60, weekendRate: 85, otRate: 75, projectId: 'p102' },
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
              { id: 'r4', name: 'Sarah Wilson', role: 'Full Stack Developer', rate: 80, weekendRate: 115, otRate: 105, projectId: 'p201' },
              { id: 'r5', name: 'David Brown', role: 'DevOps Engineer', rate: 90, weekendRate: 130, otRate: 115, projectId: 'p201' },
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
              { id: 'r6', name: 'Emily Davis', role: 'Senior Consultant', rate: 100, weekendRate: 150, otRate: 130, projectId: 'p301' },
            ]
          }
        ]
      }
    ];
    
    setAccounts(mockAccounts);
  }, []);

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
    // Mock check - in real app, this would check against invoice data
    return Math.random() > 0.5;
  };

  const getTotalProjectResources = (project: Project) => {
    return project.resources.length;
  };

  const getAverageRate = (project: Project) => {
    if (project.resources.length === 0) return 0;
    const total = project.resources.reduce((sum, resource) => sum + resource.rate, 0);
    return Math.round(total / project.resources.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
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
            <CardHeader>
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
                <Button
                  variant="outline"
                  onClick={() => setExpandedAccount(
                    expandedAccount === account.id ? null : account.id
                  )}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {expandedAccount === account.id ? 'Collapse' : 'Expand'}
                </Button>
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
                              <Button size="sm" className="bg-gradient-primary" asChild>
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
                              </tr>
                            </thead>
                            <tbody>
                              {project.resources.map((resource) => (
                                <tr key={resource.id} className="border-b">
                                  <td className="p-2 font-medium">{resource.name}</td>
                                  <td className="p-2">
                                    <Badge variant="secondary">{resource.role}</Badge>
                                  </td>
                                  <td className="p-2">${resource.rate}/hr</td>
                                  <td className="p-2">${resource.weekendRate}/hr</td>
                                  <td className="p-2">${resource.otRate}/hr</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
    </div>
  );
};

export default Accounts;