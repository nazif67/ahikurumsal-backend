'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  Grid
} from '@mui/material'

// Services
import {
  isGuvenligiIlacTalebiService,
  type IsGuvenligiIlacTalebi,
  type IsGuvenligiIlacTalebiDurum
} from '@/services/is-guvenligi-ilac-talebi.service'

// Utils
import { DURUM_COLORS, DURUM_LABELS } from '@/utils/is-guvenligi'

const TABS: { label: string; durum: IsGuvenligiIlacTalebiDurum | 'tumu' }[] = [
  { label: 'Tümü', durum: 'tumu' },
  { label: 'Yazılmadı', durum: 'yazilmadi' },
  { label: 'Yazıldı', durum: 'yazildi' },
  { label: 'Geri Dönüş Yapıldı', durum: 'geri-donus-yapildi' }
]

const IsGuvenligiIlacTalepleriPage = () => {
  const [talepler, setTalepler] = useState<IsGuvenligiIlacTalebi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadTalepler()
  }, [])

  const loadTalepler = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await isGuvenligiIlacTalebiService.getAll()
      setTalepler(data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'İlaç talepleri yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDurumChange = async (talep: IsGuvenligiIlacTalebi, durum: IsGuvenligiIlacTalebiDurum) => {
    try {
      setUpdatingId(talep.documentId)
      await isGuvenligiIlacTalebiService.updateStatus(talep.documentId, durum)
      setTalepler(prev => prev.map(t => (t.documentId === talep.documentId ? { ...t, durum } : t)))
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Durum güncellenirken bir hata oluştu')
    } finally {
      setUpdatingId(null)
    }
  }

  const activeDurum = TABS[tabValue].durum
  const filteredTalepler = activeDurum === 'tumu' ? talepler : talepler.filter(t => t.durum === activeDurum)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box>
          <Typography variant='h4' sx={{ mb: 1 }}>
            İlaç Talepleri
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Firmalarınızdaki çalışanların ilaç taleplerini görüntüleyin ve durumlarını güncelleyin
          </Typography>
        </Box>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='İlaç Talepleri'
            action={
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                {TABS.map(tab => (
                  <Tab key={tab.durum} label={tab.label} />
                ))}
              </Tabs>
            }
          />
          <CardContent>
            {filteredTalepler.length > 0 ? (
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ad Soyad</TableCell>
                      <TableCell>Firma</TableCell>
                      <TableCell>İlaçlar</TableCell>
                      <TableCell align='center'>Hekim Raporu</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell align='center'>Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTalepler.map(talep => (
                      <TableRow key={talep.documentId}>
                        <TableCell>
                          <Typography variant='body1' sx={{ fontWeight: 600 }}>
                            {talep.adSoyad}
                          </Typography>
                        </TableCell>
                        <TableCell>{talep.firma?.firmaAdi || '-'}</TableCell>
                        <TableCell>
                          {(talep.ilaclar || []).map(ilac => (
                            <Chip key={ilac.id} label={`${ilac.ilacAdi} (${ilac.mg})`} size='small' variant='outlined' sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell align='center'>
                          <Chip label={talep.hekimRaporu === 'var' ? 'Var' : 'Yok'} color={talep.hekimRaporu === 'var' ? 'success' : 'default'} size='small' />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant='body2' color={talep.aciklama ? 'text.primary' : 'text.secondary'} sx={{ whiteSpace: 'pre-wrap' }}>
                            {talep.aciklama || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(talep.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell align='center'>
                          <FormControl size='small' sx={{ minWidth: 190 }}>
                            <Select
                              value={talep.durum}
                              disabled={updatingId === talep.documentId}
                              onChange={e => handleDurumChange(talep, e.target.value as IsGuvenligiIlacTalebiDurum)}
                              renderValue={value => (
                                <Chip label={DURUM_LABELS[value as IsGuvenligiIlacTalebiDurum]} color={DURUM_COLORS[value as IsGuvenligiIlacTalebiDurum]} size='small' />
                              )}
                            >
                              {(Object.keys(DURUM_LABELS) as IsGuvenligiIlacTalebiDurum[]).map(durum => (
                                <MenuItem key={durum} value={durum}>
                                  {DURUM_LABELS[durum]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='body1' color='text.secondary'>
                  {activeDurum === 'tumu' ? 'Henüz ilaç talebi bulunmuyor' : 'Bu durumda talep bulunmuyor'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default IsGuvenligiIlacTalepleriPage
