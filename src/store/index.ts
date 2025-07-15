import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import invoiceSlice from './slices/invoiceSlice';
import dashboardSlice from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    invoices: invoiceSlice,
    dashboard: dashboardSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;