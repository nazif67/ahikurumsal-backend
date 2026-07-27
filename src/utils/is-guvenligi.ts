import type { IsGuvenligiIlacTalebiDurum } from '@/services/is-guvenligi-ilac-talebi.service'

export const DURUM_LABELS: Record<IsGuvenligiIlacTalebiDurum, string> = {
  yazilmadi: 'Yazılmadı',
  yazildi: 'Yazıldı',
  'geri-donus-yapildi': 'Geri Dönüş Yapıldı'
}

export const DURUM_COLORS: Record<IsGuvenligiIlacTalebiDurum, 'warning' | 'info' | 'success'> = {
  yazilmadi: 'warning',
  yazildi: 'info',
  'geri-donus-yapildi': 'success'
}

// Bir tarihin bugünden itibaren belirtilen gün sayısı içinde olup olmadığını kontrol eder
// (geçmiş tarihler de "yaklaşan/gecikmiş" kabul edilir — geçmişte kalmış bir muayene/eğitim de dikkat gerektirir)
export const isWithinNextDays = (dateStr: string | null | undefined, days: number): boolean => {
  if (!dateStr) return false
  const target = new Date(dateStr)
  const future = new Date()
  future.setDate(future.getDate() + days)
  return target <= future
}

export const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}
