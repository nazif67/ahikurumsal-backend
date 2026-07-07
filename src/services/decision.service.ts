import { axiosClient } from '@/libs/axios'

export interface Decision {
  id: number
  documentId: string
  institution?: {
    id: number
    name: string
  }
  title: string
  decisionDate?: string
  document?: {
    id: number
    url: string
    name: string
  }
  description?: string
  createdAt: string
  updatedAt: string
}

export const decisionService = {
  async getAll(institutionId?: string): Promise<Decision[]> {
    const params: any = {
      populate: ['institution', 'document'],
      'sort[0]': 'decisionDate:desc'
    }
    if (institutionId) {
      params['filters[institution][id]'] = institutionId
    }
    const response = await axiosClient.get('/api/decisions', { params })
    return response.data.data
  },

  async getById(documentId: string): Promise<Decision> {
    const response = await axiosClient.get(`/api/decisions/${documentId}`, {
      params: {
        populate: ['institution', 'document']
      }
    })
    return response.data.data
  },

  async create(data: Partial<Decision>): Promise<Decision> {
    const response = await axiosClient.post('/api/decisions', { data })
    return response.data.data
  },

  async update(documentId: string, data: Partial<Decision>): Promise<Decision> {
    const response = await axiosClient.put(`/api/decisions/${documentId}`, { data })
    return response.data.data
  },

  async delete(documentId: string): Promise<void> {
    await axiosClient.delete(`/api/decisions/${documentId}`)
  }
}






