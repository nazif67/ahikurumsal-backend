import { axiosClient } from '@/libs/axios'

export interface IsGuvenligiFirma {
  id: number
  documentId: string
  firmaAdi: string
  yetkiliKisi?: string
  telefon?: string
  calisanSayisi: number
  aktifCalisanSayisi: number
  pasifCalisanSayisi: number
  sonSaglikKontrolTarihi?: string
  sonrakiSaglikKontrolTarihi?: string
  sonEgitimTarihi?: string
  sonrakiEgitimTarihi?: string
  sonrakiRiskDegerlendirmeTarihi?: string
  sonrakiTatbikatTarihi?: string
  owner?: {
    id: number
    username: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export type IsGuvenligiFirmaDTO = Partial<
  Omit<IsGuvenligiFirma, 'id' | 'documentId' | 'owner' | 'createdAt' | 'updatedAt'>
>

// Form doldurulmayan tarih alanlarını '' olarak tutuyor; Strapi date alanına ''
// gelince "Invalid format, expected yyyy-MM-dd" ile 400 döner ve kayıt hiç oluşmaz.
// Boş string'leri null'a çevirerek "alan boş bırakıldı" anlamını koruyoruz.
const bosAlanlariTemizle = (data: IsGuvenligiFirmaDTO): Record<string, unknown> =>
  Object.fromEntries(Object.entries(data).map(([alan, deger]) => [alan, deger === '' ? null : deger]))

export const isGuvenligiFirmaService = {
  async getAll(): Promise<IsGuvenligiFirma[]> {
    const response = await axiosClient.get('/api/is-guvenligi-firmalar', {
      params: { 'pagination[pageSize]': 200 }
    })
    return response.data.data
  },

  async getById(id: string): Promise<IsGuvenligiFirma> {
    const response = await axiosClient.get(`/api/is-guvenligi-firmalar/${id}`)
    return response.data.data
  },

  async create(data: IsGuvenligiFirmaDTO): Promise<IsGuvenligiFirma> {
    const response = await axiosClient.post('/api/is-guvenligi-firmalar', { data: bosAlanlariTemizle(data) })
    return response.data.data
  },

  async update(id: string, data: IsGuvenligiFirmaDTO): Promise<IsGuvenligiFirma> {
    const response = await axiosClient.put(`/api/is-guvenligi-firmalar/${id}`, {
      data: bosAlanlariTemizle(data)
    })
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/api/is-guvenligi-firmalar/${id}`)
  }
}
