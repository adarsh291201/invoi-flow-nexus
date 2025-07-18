import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Account } from '../../types';

const initialState: { accounts: Account[] } = { accounts: [] };

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.accounts = action.payload;
    },
  },
});

export const { setAccounts } = accountsSlice.actions;
export default accountsSlice.reducer; 