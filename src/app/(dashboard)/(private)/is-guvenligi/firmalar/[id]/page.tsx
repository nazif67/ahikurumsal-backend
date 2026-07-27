'use client'

import { use, useEffect, useState } from 'react'

// MUI Imports
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Box,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material'

// Component Imports
import Link from '@components/Link'

// Services
import { isGuvenligiFirmaService, type IsGuvenligiFirma } from '@/services/is-guvenligi-firma.service'
import { isGuvenligiIlacTalebiService, type IsGuvenligiIlacTalebi } from '@/services/is-guvenligi-ilac-talebi.service'

// Utils
import { DURUM_COLORS, DURUM_LABELS } from '@/utils/is-guvenligi'

const tarihGoster = (tarih?: string) => (tarih ? new Date(tarih).toLocaleDateString('tr-TR') : '-')

const IsGuvenligiFirmaDetayPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)

  const [firma, setFirma] = useState<IsGuvenligiFirma | null>(null)
  const [talepler, setTalepler] = useState<IsGuvenligiIlacTalebi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [firmaData, tumTalepler] = await Promise.all([
          isGuvenligiFirmaService.getById(id),
          isGuvenligiIlacTalebiService.getAll()
        ])
        setFirma(firmaData)
        setTalepler(tumTalepler.filter(t => t.firma?.documentId === id))
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Firma bilgileri yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !firma) {
    return (
      <Alert severity='error'>{error || 'Firma bulunamadı'}</Alert>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='h4' sx={{ mb: 1 }}>
              {firma.firmaAdi}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {firma.yetkiliKisi || 'Yetkili kişi belirtilmemiş'}
            </Typography>
          </Box>
          <Button component={Link} href='/is-guvenligi/firmalar' variant='outlined' startIcon={<i className='tabler-arrow-left' />}>
            Firmalara Dön
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Firma Bilgileri' />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant='caption' color='text.secondary'>Yetkili Kişi</Typography>
                <Typography variant='body1'>{firma.yetkiliKisi || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>Telefon</Typography>
                <Typography variant='body1'>{firma.telefon || '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size='small' label={`${firma.calisanSayisi || 0} çalışan`} />
                <Chip size='small' color='success' label={`${firma.aktifCalisanSayisi || 0} aktif`} />
                <Chip size='small' label={`${firma.pasifCalisanSayisi || 0} pasif`} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title='Sağlık, Eğitim ve Risk Takibi' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Son Sağlık Kontrol Tarihi</Typography>
                <Typography variant='body1'>{tarihGoster(firma.sonSaglikKontrolTarihi)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Sonraki Sağlık Kontrol Tarihi</Typography>
                <Typography variant='body1'>{tarihGoster(firma.sonrakiSaglikKontrolTarihi)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Son Eğitim Tarihi</Typography>
                <Typography variant='body1'>{tarihGoster(firma.sonEgitimTarihi)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Sonraki Eğitim Tarihi</Typography>
                <Typography variant='body1'>{tarihGoster(firma.sonrakiEgitimTarihi)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Sonraki Risk Değerlendirme Tarihi</Typography>
                <Typography variant='body1'>{tarihGoster(firma.sonrakiRiskDegerlendirmeTarihi)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Sonraki Acil Durum Tatbikatı Tarihi</Typography>
                <Typography variant='body1'>{tarihGoster(firma.sonrakiTatbikatTarihi)}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title={`İlaç Talepleri (${talepler.length})`} />
          <CardContent>
            {talepler.length > 0 ? (
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ad Soyad</TableCell>
                      <TableCell>İlaçlar</TableCell>
                      <TableCell align='center'>Hekim Raporu</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell align='center'>Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {talepler.map(talep => (
                      <TableRow key={talep.documentId}>
                        <TableCell>{talep.adSoyad}</TableCell>
                        <TableCell>
                          {(talep.ilaclar || []).map(ilac => (
                            <Chip key={ilac.id} label={`${ilac.ilacAdi} (${ilac.mg})`} size='small' variant='outlined' sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell align='center'>
                          <Chip label={talep.hekimRaporu === 'var' ? 'Var' : 'Yok'} color={talep.hekimRaporu === 'var' ? 'success' : 'default'} size='small' />
                        </TableCell>
                        <TableCell>{new Date(talep.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell align='center'>
                          <Chip label={DURUM_LABELS[talep.durum]} color={DURUM_COLORS[talep.durum]} size='small' />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='body2' color='text.secondary'>
                  Bu firmaya ait ilaç talebi bulunmuyor
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default IsGuvenligiFirmaDetayPage
