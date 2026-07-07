import { axiosClient } from '@/libs/axios'

export interface Reminder {
  id: number
  documentId: string
  title: string
  description?: string
  reminderDate: string
  reminderType: 'dask_policy' | 'vehicle_insurance' | 'vehicle_inspection' | 'custom'
  phoneNumber?: string
  message?: string
  isSent: boolean
  sentAt?: string
  status: 'pending' | 'sent' | 'failed'
  relatedProperty?: {
    id: number
    address?: string
    institution?: {
      id: number
      name: string
    }
  }
  relatedVehicle?: {
    id: number
    plateNumber: string
    model: string
    institution?: {
      id: number
      name: string
    }
  }
  createdAt: string
  updatedAt: string
}

export const reminderService = {
  async getAll(): Promise<Reminder[]> {
    const response = await axiosClient.get('/api/reminders', {
      params: {
        populate: ['relatedProperty', 'relatedVehicle', 'relatedProperty.institution', 'relatedVehicle.institution']
      }
    })
    return response.data.data
  },

  async getById(documentId: string): Promise<Reminder> {
    const response = await axiosClient.get(`/api/reminders/${documentId}`, {
      params: {
        populate: ['relatedProperty', 'relatedVehicle', 'relatedProperty.institution', 'relatedVehicle.institution']
      }
    })
    return response.data.data
  },

  async create(data: Partial<Reminder>): Promise<Reminder> {
    const response = await axiosClient.post('/api/reminders', { data })
    return response.data.data
  },

  async update(documentId: string, data: Partial<Reminder>): Promise<Reminder> {
    const response = await axiosClient.put(`/api/reminders/${documentId}`, { data })
    return response.data.data
  },

  async delete(documentId: string): Promise<void> {
    await axiosClient.delete(`/api/reminders/${documentId}`)
  },

  async sendWhatsApp(documentId: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.post(`/api/reminders/${documentId}/send-whatsapp`)
    return response.data
  },

  async syncReminders(): Promise<{ success: boolean; message: string; createdCount: number }> {
    const response = await axiosClient.post('/api/reminders/sync')
    return response.data
  }
}


