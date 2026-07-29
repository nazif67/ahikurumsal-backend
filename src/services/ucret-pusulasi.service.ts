import { axiosClient } from '@/libs/axios'

export type PusulaDurum = 'taslak' | 'gonderildi'
export type CalisanOnayDurum = 'beklemede' | 'onaylandi'

export type EslesmeDurumu =
  | 'eslesti'
  | 'manuel-eslesti'
  | 'tc-bulunamadi'
  | 'coklu-tc'
  | 'calisan-bulunamadi'
  | 'coklu-calisan'

export interface PusulaWorker {
  id: string
  firstName: string
  lastName: string
  tcKimlikNoMaskeli: string
}

export interface UcretPusulasi {
  id: string
  donemYil: number
  donemAy: number
  durum: PusulaDurum
  calisanOnayDurumu: CalisanOnayDurum
  calisanOnayAt?: string | null
  dosyaAdi: string
  dosyaBoyut?: number
  sayfaNo?: number
  gonderildiAt?: string | null
  createdAt: string

  // Yalnızca işveren görünümünde dolu gelir
  partiId?: string
  eslesmeDurumu?: EslesmeDurumu
  kaynakDosyaAdi?: string
  ilkGoruntulenmeAt?: string | null
  indirmeSayisi?: number
  okunanTcMaskeli?: string
  worker?: PusulaWorker | null
  mevcutPusulaVar?: boolean
}

export interface AnalizSonucu {
  partiId: string
  donemYil: number
  donemAy: number
  toplam: number
  ozet: Record<string, number>
  pusulalar: UcretPusulasi[]
}

export const ESLESME_LABELS: Record<EslesmeDurumu, string> = {
  eslesti: 'Eşleşti',
  'manuel-eslesti': 'Elle eşleştirildi',
  'tc-bulunamadi': 'TC bulunamadı',
  'coklu-tc': 'Sayfada birden fazla TC',
  'calisan-bulunamadi': 'Bu TC ile çalışan yok',
  'coklu-calisan': 'Aynı TC birden fazla çalışanda'
}

export const ESLESME_COLORS: Record<EslesmeDurumu, 'success' | 'info' | 'warning' | 'error'> = {
  eslesti: 'success',
  'manuel-eslesti': 'info',
  'tc-bulunamadi': 'warning',
  'coklu-tc': 'error',
  'calisan-bulunamadi': 'warning',
  'coklu-calisan': 'error'
}

export const AY_ADLARI = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
]

export const donemEtiketi = (yil: number, ay: number) => `${AY_ADLARI[ay - 1] ?? ay} ${yil}`

export const ucretPusulasiService = {
  /** İşveren: PDF(ler)i yükleyip sayfa sayfa analiz ettirir (henüz kimseye gönderilmez) */
  async analiz(dosyalar: File[], donemYil: number, donemAy: number): Promise<AnalizSonucu> {
    const formData = new FormData()

    dosyalar.forEach(dosya => formData.append('files', dosya))
    formData.append('donemYil', String(donemYil))
    formData.append('donemAy', String(donemAy))

    const response = await axiosClient.post('/api/ucret-pusulalari/analiz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return response.data.data
  },

  /** İşveren: eşleşmeyen bir sayfayı elle bir çalışana bağlar */
  async eslestir(pusulaId: string, workerId: string): Promise<UcretPusulasi> {
    const response = await axiosClient.put(`/api/ucret-pusulalari/${pusulaId}/eslestir`, {
      data: { workerId }
    })

    return response.data.data
  },

  /** İşveren: onaylanan taslakları çalışan panellerine açar */
  async gonder(partiId: string): Promise<{ gonderilen: number; atlanan: number; mesaj: string }> {
    const response = await axiosClient.post('/api/ucret-pusulalari/gonder', { data: { partiId } })

    return response.data.data
  },

  /** İşveren: şirketin pusulaları */
  async listele(filtreler: { partiId?: string; durum?: PusulaDurum; donemYil?: number; donemAy?: number } = {}): Promise<
    UcretPusulasi[]
  > {
    const params: Record<string, any> = { 'pagination[pageSize]': 500 }

    Object.entries(filtreler).forEach(([anahtar, deger]) => {
      if (deger !== undefined && deger !== null && deger !== '') params[`filters[${anahtar}]`] = deger
    })

    const response = await axiosClient.get('/api/ucret-pusulalari', { params })

    return response.data.data || []
  },

  async sil(pusulaId: string): Promise<void> {
    await axiosClient.delete(`/api/ucret-pusulalari/${pusulaId}`)
  },

  /** Çalışan: kendisine gönderilmiş pusulalar */
  async benimPusulalarim(): Promise<UcretPusulasi[]> {
    const response = await axiosClient.get('/api/ucret-pusulalari/benim')

    return response.data.data || []
  },

  /** Çalışan: pusulayı onaylar */
  async onayla(pusulaId: string): Promise<UcretPusulasi> {
    const response = await axiosClient.post(`/api/ucret-pusulalari/${pusulaId}/onayla`)

    return response.data.data
  },

  /**
   * PDF'i yetki kontrolünden geçen uçtan indirir.
   * Dosya public bir URL'de durmadığı için doğrudan link verilemez; blob açılır.
   */
  async dosyaAc(pusulaId: string): Promise<void> {
    const response = await axiosClient.get(`/api/ucret-pusulalari/${pusulaId}/dosya`, {
      responseType: 'blob'
    })

    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))

    window.open(url, '_blank', 'noopener,noreferrer')

    // Sekme açıldıktan sonra bellekteki blob'u bırak
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
