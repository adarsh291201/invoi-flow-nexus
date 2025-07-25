import { mockAccounts } from '../mocks/mockAccounts';
import { mockProjects } from '../mocks/mockProjects';
import type { AccountSummary, ProjectWithResources } from '../types/mockApiTypes';

export const getAccounts = async (): Promise<AccountSummary[]> => mockAccounts;

export const getProjects = async (accountId: string): Promise<ProjectWithResources[]> =>
  mockProjects.filter(p => p.accountId === accountId); 