import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setStats } from '../store/slices/dashboardSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Clock, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats } = useSelector((state: RootState) => state.dashboard);
  const dispatch = useDispatch();

  useEffect(() => {
    // Mock dashboard data
    const mockStats = {
      totalInvoices: 156,
      pendingApproval: 23,
      approved: 128,
      rejected: 5,
      totalAmount: 245600,
      monthlyTrend: [
        { month: 'Jan', amount: 45000, count: 15 },
        { month: 'Feb', amount: 52000, count: 18 },
        { month: 'Mar', amount: 48000, count: 16 },
        { month: 'Apr', amount: 61000, count: 21 },
        { month: 'May', amount: 55000, count: 19 },
        { month: 'Jun', amount: 63000, count: 22 },
      ],
    };
    dispatch(setStats(mockStats));
  }, [dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificActions = () => {
    switch (user?.role) {
      case 'L1':
        return [
          { label: 'Generate New Invoice', href: '/invoice/generate', primary: true },
          { label: 'View Pending Invoices', href: '/invoices?status=Pending L2' },
          { label: 'Manage Project Rates', href: '/rates' },
        ];
      case 'L2':
        return [
          { label: 'Review Pending Invoices', href: '/invoices?status=Pending L2', primary: true },
          { label: 'View Reports', href: '/reports' },
          { label: 'Check Audit Logs', href: '/audit' },
        ];
      case 'L3':
        return [
          { label: 'Final Approval Queue', href: '/invoices?status=Pending L3', primary: true },
          { label: 'Dispatch Approved', href: '/invoices?status=Approved' },
          { label: 'Monthly Reports', href: '/reports' },
        ];
      case 'Admin':
        return [
          { label: 'System Administration', href: '/admin', primary: true },
          { label: 'All Reports', href: '/reports' },
          { label: 'User Management', href: '/admin' },
        ];
      default:
        return [];
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight headline-blue">
          Hi!!! {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your invoices today.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-status-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-status-approved" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Ready for dispatch
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Actions available for your role: {user?.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {getRoleSpecificActions().map((action, index) => (
              <Button
                key={index}
                asChild
                variant="blue"
                className={action.primary ? "" : ""}
              >
                <Link to={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Invoice generation over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.monthlyTrend.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-sm">{month.month}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      ${month.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({month.count} invoices)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Status</span>
                <span className="flex items-center text-sm text-status-approved">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <span className="text-sm font-medium">23</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;