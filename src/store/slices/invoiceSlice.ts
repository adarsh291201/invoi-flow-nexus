import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, InvoiceStatus } from '../../types';

interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  filters: {
    status: InvoiceStatus | 'All';
    month: string;
    project: string;
    client: string;
  };
  loading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  currentInvoice: null,
  filters: {
    status: 'All',
    month: '',
    project: '',
    client: '',
  },
  loading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.invoices = action.payload;
    },
    setCurrentInvoice: (state, action: PayloadAction<Invoice>) => {
      state.currentInvoice = action.payload;
    },
    updateInvoiceStatus: (state, action: PayloadAction<{ id: string; status: InvoiceStatus; comment?: string }>) => {
      const { id, status, comment } = action.payload;
      const invoice = state.invoices.find(inv => inv.id === id);
      if (invoice) {
        invoice.status = status;
        if (comment) {
          invoice.history.push({
            id: Date.now().toString(),
            action: `Status changed to ${status}`,
            by: 'Current User',
            byId: 'current',
            date: new Date().toISOString(),
            comment,
          });
        }
      }
    },
    setFilters: (state, action: PayloadAction<Partial<InvoiceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setInvoices,
  setCurrentInvoice,
  updateInvoiceStatus,
  setFilters,
  setLoading,
  setError,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;