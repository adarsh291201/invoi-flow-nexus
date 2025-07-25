import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Accounts from './pages/Accounts';
import InvoiceGeneration from './pages/InvoiceGeneration';
import InvoicePreview from './pages/InvoicePreview';
import Settings from './pages/Settings';
import NotFound from "./pages/NotFound";
import InvoiceDetails from './pages/InvoiceDetails';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="invoice/generate" element={<InvoiceGeneration />} />
              <Route path="invoice/generate/:templateId" element={<InvoiceGeneration />} />
              <Route path="invoice/edit/:id" element={<InvoiceGeneration mode="edit" />} />
              <Route path="invoice/:id/preview" element={<InvoicePreview />} />
              <Route path="invoice/:id" element={<InvoiceDetails />} />
              <Route path="settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Provider>
  </QueryClientProvider>
);

export default App;
