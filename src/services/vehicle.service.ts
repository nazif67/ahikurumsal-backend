import { axiosClient } from '@/libs/axios'

export interface Vehicle {
  id: number
  documentId: string
  institution?: {
    id: number
    name: string
  }
  photo?: {
    id: number
    url: string
    name: string
  }
  plateNumber: string
  model: string
  inspectionDate?: string
  insurancePolicyDate?: string
  usedBy?: string
  createdAt: string
  updatedAt: string
}

export const vehicleService = {
  async getAll(institutionId?: string): Promise<Vehicle[]> {
    const params: any = {
      populate: ['institution', 'photo']
    }
    if (institutionId) {
      params.institutionId = institutionId
    }
    const response = await axiosClient.get('/api/vehicles', { params })
    return response.data.data
  },

  async getById(documentId: string): Promise<Vehicle> {
    const response = await axiosClient.get(`/api/vehicles/${documentId}`, {
      params: {
        populate: ['institution', 'photo']
      }
    })
    return response.data.data
  },

  async create(data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await axiosClient.post('/api/vehicles', { data })
    return response.data.data
  },

  async update(documentId: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await axiosClient.put(`/api/vehicles/${documentId}`, { data })
    return response.data.data
  },

  async delete(documentId: string): Promise<void> {
    await axiosClient.delete(`/api/vehicles/${documentId}`)
  }
}






