export interface AccountSummary {
  id: string;
  name: string;
  projectCount: number;
}

import { Resource } from './index';

export interface ProjectWithResources {
  id: string;
  name: string;
  accountId: string;
  resources: Resource[];
} 