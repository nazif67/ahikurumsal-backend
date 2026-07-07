import { axiosClient } from '@/libs/axios'

export interface Property {
  id: number
  documentId: string
  institution?: {
    id: number
    name: string
    taxNumber?: string
  }
  photo?: {
    id: number
    url: string
    name: string
  }
  usageType?: string
  address?: string
  uavtAddress?: string
  daskPolicyNumber?: string
  daskPolicyDate?: string
  acquisitionMethod?: string
  daskPolicy?: {
    id: number
    url: string
    name: string
  }
  titleDeed?: {
    id: number
    url: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export const propertyService = {
  async getAll(institutionId?: string): Promise<Property[]> {
    const params: any = {
      populate: ['institution', 'photo', 'daskPolicy', 'titleDeed']
    }
    if (institutionId) {
      params.institutionId = institutionId
    }
    const response = await axiosClient.get('/api/properties', { params })
    return response.data.data
  },

  async getById(documentId: string): Promise<Property> {
    const response = await axiosClient.get(`/api/properties/${documentId}`, {
      params: {
        populate: ['institution', 'photo', 'daskPolicy', 'titleDeed']
      }
    })
    return response.data.data
  },

  async create(data: Partial<Property>): Promise<Property> {
    const response = await axiosClient.post('/api/properties', { data })
    return response.data.data
  },

  async update(documentId: string, data: Partial<Property>): Promise<Property> {
    const response = await axiosClient.put(`/api/properties/${documentId}`, { data })
    return response.data.data
  },

  async delete(documentId: string): Promise<void> {
    await axiosClient.delete(`/api/properties/${documentId}`)
  }
}






