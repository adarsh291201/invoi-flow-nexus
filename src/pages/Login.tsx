import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess } from '../store/slices/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock users for demo
  const mockUsers = [
    { id: 'u1', email: 'alice@company.com', password: 'password', name: 'Alice Johnson', role: 'L1' as const },
    { id: 'u2', email: 'bob@company.com', password: 'password', name: 'Bob Smith', role: 'L2' as const },
    { id: 'u3', email: 'claire@company.com', password: 'password', name: 'Claire Wilson', role: 'L3' as const },
    { id: 'u4', email: 'admin@company.com', password: 'password', name: 'Admin User', role: 'Admin' as const },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart());

    // Simulate API call
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        dispatch(loginSuccess({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }));
        navigate('/');
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        });
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">InvoiceFlow</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to manage invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary">
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs">
              <p><strong>L1 User:</strong> alice@company.com / password</p>
              <p><strong>L2 User:</strong> bob@company.com / password</p>
              <p><strong>L3 User:</strong> claire@company.com / password</p>
              <p><strong>Admin:</strong> admin@company.com / password</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;