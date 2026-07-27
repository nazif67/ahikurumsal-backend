'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material'

// Types
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Services
import { isGuvenligiFirmaService, type IsGuvenligiFirma } from '@/services/is-guvenligi-firma.service'
import { isGuvenligiIlacTalebiService, type IsGuvenligiIlacTalebi } from '@/services/is-guvenligi-ilac-talebi.service'

// Utils
import { formatNumber } from '@core/utils/format'
import { DURUM_COLORS, DURUM_LABELS, isToday, isWithinNextDays } from '@/utils/is-guvenligi'

const YAKLASAN_GUN = 30

interface StatCard {
  title: string
  value: number
  caption: string
  icon: string
  color: string
}

const IsGuvenligiDashboardPage = () => {
  const [firmalar, setFirmalar] = useState<IsGuvenligiFirma[]>([])
  const [talepler, setTalepler] = useState<IsGuvenligiIlacTalebi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [firmaData, talepData] = await Promise.all([
          isGuvenligiFirmaService.getAll(),
          isGuvenligiIlacTalebiService.getAll()
        ])
        setFirmalar(firmaData)
        setTalepler(talepData)
      } catch (error) {
        console.error('Dashboard verisi yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const stats = useMemo(() => {
    const toplamFirma = firmalar.length
    const toplamCalisan = firmalar.reduce((sum, f) => sum + (f.calisanSayisi || 0), 0)
    const bugunkuTalepler = talepler.filter(t => isToday(t.createdAt)).length
    const bekleyenTalepler = talepler.filter(t => t.durum === 'yazilmadi').length
    const tamamlananTalepler = talepler.filter(t => t.durum === 'geri-donus-yapildi').length
    const yaklasanSaglik = firmalar.filter(f => isWithinNextDays(f.sonrakiSaglikKontrolTarihi, YAKLASAN_GUN)).length
    const yaklasanEgitim = firmalar.filter(f => isWithinNextDays(f.sonrakiEgitimTarihi, YAKLASAN_GUN)).length
    const yaklasanRisk = firmalar.filter(f => isWithinNextDays(f.sonrakiRiskDegerlendirmeTarihi, YAKLASAN_GUN)).length
    const yaklasanTatbikat = firmalar.filter(f => isWithinNextDays(f.sonrakiTatbikatTarihi, YAKLASAN_GUN)).length

    return {
      toplamFirma,
      toplamCalisan,
      bugunkuTalepler,
      bekleyenTalepler,
      tamamlananTalepler,
      yaklasanSaglik,
      yaklasanEgitim,
      yaklasanRisk,
      yaklasanTatbikat
    }
  }, [firmalar, talepler])

  const statCards: StatCard[] = [
    { title: 'Toplam Firma', value: stats.toplamFirma, caption: 'Yönetilen firma', icon: 'tabler-building', color: 'primary.main' },
    { title: 'Toplam Çalışan', value: stats.toplamCalisan, caption: 'Tüm firmalarda', icon: 'tabler-users', color: 'success.main' },
    { title: 'Bugünkü İlaç Talepleri', value: stats.bugunkuTalepler, caption: 'Bugün oluşturulan', icon: 'tabler-calendar-event', color: 'info.main' },
    { title: 'Bekleyen İlaç Talepleri', value: stats.bekleyenTalepler, caption: 'Henüz yazılmadı', icon: 'tabler-clock', color: 'warning.main' },
    { title: 'Tamamlanan İlaç Talepleri', value: stats.tamamlananTalepler, caption: 'Geri dönüş yapıldı', icon: 'tabler-check', color: 'success.main' },
    { title: 'Yaklaşan Sağlık Muayeneleri', value: stats.yaklasanSaglik, caption: `Önümüzdeki ${YAKLASAN_GUN} gün`, icon: 'tabler-stethoscope', color: 'error.main' },
    { title: 'Yaklaşan İş Güvenliği Eğitimleri', value: stats.yaklasanEgitim, caption: `Önümüzdeki ${YAKLASAN_GUN} gün`, icon: 'tabler-school', color: 'secondary.main' },
    { title: 'Yaklaşan Risk Değerlendirmeleri', value: stats.yaklasanRisk, caption: `Önümüzdeki ${YAKLASAN_GUN} gün`, icon: 'tabler-alert-triangle', color: 'warning.main' },
    { title: 'Yaklaşan Acil Durum Tatbikatları', value: stats.yaklasanTatbikat, caption: `Önümüzdeki ${YAKLASAN_GUN} gün`, icon: 'tabler-alarm', color: 'info.main' }
  ]

  // Aylık ilaç talebi grafiği - son 6 ay
  const monthlyChart = useMemo(() => {
    const months: { key: string; label: string }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      })
    }

    const counts = months.map(({ key }) => {
      return talepler.filter(t => {
        const d = new Date(t.createdAt)
        return `${d.getFullYear()}-${d.getMonth()}` === key
      }).length
    })

    return { categories: months.map(m => m.label), counts }
  }, [talepler])

  // Firmalara göre talep dağılımı
  const firmaDagilimi = useMemo(() => {
    const map = new Map<string, number>()
    talepler.forEach(t => {
      const ad = t.firma?.firmaAdi || 'Bilinmiyor'
      map.set(ad, (map.get(ad) || 0) + 1)
    })
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    return { labels: entries.map(e => e[0]), series: entries.map(e => e[1]) }
  }, [talepler])

  // En çok kullanılan ilaçlar
  const ilacKullanimi = useMemo(() => {
    const map = new Map<string, number>()
    talepler.forEach(t => {
      ;(t.ilaclar || []).forEach(ilac => {
        map.set(ilac.ilacAdi, (map.get(ilac.ilacAdi) || 0) + 1)
      })
    })
    const entries = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    return { categories: entries.map(e => e[0]), counts: entries.map(e => e[1]) }
  }, [talepler])

  const sonIslemler = useMemo(() => {
    return [...talepler]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
  }, [talepler])

  const monthlyOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    xaxis: { categories: monthlyChart.categories },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    colors: ['var(--mui-palette-primary-main)']
  }

  const firmaDagilimOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    labels: firmaDagilimi.labels,
    legend: { position: 'bottom' },
    dataLabels: { enabled: true }
  }

  const ilacOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    xaxis: { categories: ilacKullanimi.categories },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    colors: ['var(--mui-palette-success-main)']
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      {statCards.map(card => (
        <Grid item xs={12} sm={6} md={4} key={card.title}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant='h6' color='text.primary'>
                    {card.title}
                  </Typography>
                  <Typography variant='h4' sx={{ mb: 1 }}>
                    {formatNumber(card.value)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {card.caption}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: card.color,
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i className={card.icon} style={{ fontSize: 24, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Aylık İlaç Talebi Grafiği' />
          <CardContent>
            <AppReactApexCharts type='bar' height={320} width='100%' series={[{ name: 'Talep', data: monthlyChart.counts }]} options={monthlyOptions} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Firmalara Göre Talep Dağılımı' />
          <CardContent>
            {firmaDagilimi.series.length > 0 ? (
              <AppReactApexCharts type='donut' height={320} width='100%' series={firmaDagilimi.series} options={firmaDagilimOptions} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant='body2' color='text.secondary'>
                  Henüz ilaç talebi bulunmuyor
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='En Çok Kullanılan İlaçlar' />
          <CardContent>
            {ilacKullanimi.categories.length > 0 ? (
              <AppReactApexCharts type='bar' height={320} width='100%' series={[{ name: 'Kullanım', data: ilacKullanimi.counts }]} options={ilacOptions} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant='body2' color='text.secondary'>
                  Henüz ilaç talebi bulunmuyor
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Son İşlemler' />
          <CardContent>
            {sonIslemler.length > 0 ? (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ad Soyad</TableCell>
                      <TableCell>Firma</TableCell>
                      <TableCell align='center'>Durum</TableCell>
                      <TableCell>Tarih</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sonIslemler.map(t => (
                      <TableRow key={t.documentId}>
                        <TableCell>{t.adSoyad}</TableCell>
                        <TableCell>{t.firma?.firmaAdi || '-'}</TableCell>
                        <TableCell align='center'>
                          <Chip label={DURUM_LABELS[t.durum]} color={DURUM_COLORS[t.durum]} size='small' />
                        </TableCell>
                        <TableCell>{new Date(t.updatedAt).toLocaleDateString('tr-TR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant='body2' color='text.secondary'>
                  Henüz işlem bulunmuyor
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default IsGuvenligiDashboardPage
