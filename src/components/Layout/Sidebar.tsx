import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Calculator, 
  FileImage, 
  Activity, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['L1', 'L2', 'L3', 'Admin'] },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['L1', 'L2', 'L3', 'Admin'] },
    { name: 'Accounts', href: '/accounts', icon: Calculator, roles: ['L1', 'L2', 'L3', 'Admin'] },
    { name: 'Generate Invoice', href: '/invoice/generate', icon: PlusCircle, roles: ['L1'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['L1', 'L2', 'L3', 'Admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div
      style={{ backgroundColor: "rgb(6, 65, 115)" }}
      className={cn(
        "text-nav-foreground shadow-nav transition-all duration-300",
        collapsed ? "w-24" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-nav-foreground/10">
        <img
          src="/paltechlogo.svg"
          alt="Paltech Logo"
          className={collapsed ? "h-10 mx-auto" : "h-10 mr-2"}
        />
        {!collapsed && (
          <h1 className="text-xl font-bold sr-only">InvoiceFlow</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-nav-foreground hover:bg-nav-foreground/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors sidebar-nav-link",
                    "hover:bg-nav-foreground/10",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-nav-foreground"
                  )
                }
              >
                <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-nav-foreground/5 rounded-lg p-3">
            <p className="text-xs text-nav-foreground/70">Logged in as</p>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-primary">{user?.role}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;