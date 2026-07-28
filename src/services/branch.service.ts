import { axiosClient } from '@/libs/axios';

export type TehlikeSinifi = 'az_tehlikeli' | 'tehlikeli' | 'cok_tehlikeli';

export const TEHLIKE_SINIFI_LABELS: Record<TehlikeSinifi, string> = {
  az_tehlikeli: 'Az Tehlikeli',
  tehlikeli: 'Tehlikeli',
  cok_tehlikeli: 'Çok Tehlikeli'
};

export interface BranchManager {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface Branch {
  id: number;
  documentId: string;
  key: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  sgkSubeKodu?: string;
  sgkSicilNo?: string;
  sgkIsyeriUnvani?: string;
  naceKodu?: string;
  tehlikeSinifi?: TehlikeSinifi;
  openingDate?: string;
  isActive?: boolean;
  manager?: BranchManager | null;

  // Controller tarafından hesaplanan istatistikler
  workerCount?: number;
  activeWorkerCount?: number;
  departmentCount?: number;

  createdAt: string;
  updatedAt: string;
  company?: {
    id: number;
    documentId: string;
  };
}

export interface CreateBranchDTO {
  key: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  sgkSubeKodu?: string;
  sgkSicilNo?: string;
  sgkIsyeriUnvani?: string;
  naceKodu?: string;
  tehlikeSinifi?: TehlikeSinifi | '';
  openingDate?: string;
  isActive?: boolean;
  managerId?: number | null;
}

export type UpdateBranchDTO = Partial<CreateBranchDTO>;

export interface StrapiResponse<T> {
  data: T;
  meta?: any;
  error?: any;
}

class BranchService {
  private static instance: BranchService;

  public static getInstance(): BranchService {
    if (!BranchService.instance) {
      BranchService.instance = new BranchService();
    }
    return BranchService.instance;
  }

  public async getBranches(): Promise<StrapiResponse<Branch[]>> {
    try {
      const response = await axiosClient.get('/api/branches');
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  public async getBranch(documentId: string): Promise<StrapiResponse<Branch>> {
    try {
      const response = await axiosClient.get(`/api/branches/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  }

  public async createBranch(data: CreateBranchDTO): Promise<StrapiResponse<Branch>> {
    try {
      const response = await axiosClient.post('/api/branches', { data });
      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  public async updateBranch(documentId: string, data: UpdateBranchDTO): Promise<StrapiResponse<Branch>> {
    try {
      const response = await axiosClient.put(`/api/branches/${documentId}`, { data });
      return response.data;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  public async deleteBranch(documentId: string): Promise<void> {
    try {
      await axiosClient.delete(`/api/branches/${documentId}`);
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }
}

export const branchService = BranchService.getInstance();
