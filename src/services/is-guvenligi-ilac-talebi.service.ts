import { axiosClient } from '@/libs/axios'

export type IsGuvenligiIlacTalebiDurum = 'yazilmadi' | 'yazildi' | 'geri-donus-yapildi'

export interface IsGuvenligiIlacTalebi {
  id: number
  documentId: string
  adSoyad: string
  ilaclar: { id: number; ilacAdi: string; mg: string }[]
  hekimRaporu: 'var' | 'yok'
  aciklama?: string | null
  durum: IsGuvenligiIlacTalebiDurum
  firma?: {
    id: number
    documentId: string
    firmaAdi: string
  }
  createdAt: string
  updatedAt: string
}

export const isGuvenligiIlacTalebiService = {
  async getAll(): Promise<IsGuvenligiIlacTalebi[]> {
    const response = await axiosClient.get('/api/is-guvenligi-ilac-talepleri', {
      params: { 'pagination[pageSize]': 500 }
    })
    return response.data.data
  },

  async getById(id: string): Promise<IsGuvenligiIlacTalebi> {
    const response = await axiosClient.get(`/api/is-guvenligi-ilac-talepleri/${id}`)
    return response.data.data
  },

  async updateStatus(id: string, durum: IsGuvenligiIlacTalebiDurum): Promise<IsGuvenligiIlacTalebi> {
    const response = await axiosClient.put(`/api/is-guvenligi-ilac-talepleri/${id}/durum`, {
      data: { durum }
    })
    return response.data.data
  }
}
