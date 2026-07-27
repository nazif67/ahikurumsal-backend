'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'

// Component Imports
import Link from '@components/Link'

// Services
import { isGuvenligiFirmaService, type IsGuvenligiFirma, type IsGuvenligiFirmaDTO } from '@/services/is-guvenligi-firma.service'

const EMPTY_FORM: IsGuvenligiFirmaDTO = {
  firmaAdi: '',
  yetkiliKisi: '',
  telefon: '',
  calisanSayisi: 0,
  aktifCalisanSayisi: 0,
  pasifCalisanSayisi: 0,
  sonSaglikKontrolTarihi: '',
  sonrakiSaglikKontrolTarihi: '',
  sonEgitimTarihi: '',
  sonrakiEgitimTarihi: '',
  sonrakiRiskDegerlendirmeTarihi: '',
  sonrakiTatbikatTarihi: ''
}

const IsGuvenligiFirmalarPage = () => {
  const [firmalar, setFirmalar] = useState<IsGuvenligiFirma[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<IsGuvenligiFirmaDTO>(EMPTY_FORM)

  useEffect(() => {
    loadFirmalar()
  }, [])

  const loadFirmalar = async () => {
    try {
      setLoading(true)
      setFirmalar(await isGuvenligiFirmaService.getAll())
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Firmalar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNewDialog = () => {
    setEditMode(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setDialogOpen(true)
  }

  const handleEdit = (firma: IsGuvenligiFirma) => {
    setEditMode(true)
    setEditingId(firma.documentId)
    setFormData({
      firmaAdi: firma.firmaAdi,
      yetkiliKisi: firma.yetkiliKisi || '',
      telefon: firma.telefon || '',
      calisanSayisi: firma.calisanSayisi || 0,
      aktifCalisanSayisi: firma.aktifCalisanSayisi || 0,
      pasifCalisanSayisi: firma.pasifCalisanSayisi || 0,
      sonSaglikKontrolTarihi: firma.sonSaglikKontrolTarihi || '',
      sonrakiSaglikKontrolTarihi: firma.sonrakiSaglikKontrolTarihi || '',
      sonEgitimTarihi: firma.sonEgitimTarihi || '',
      sonrakiEgitimTarihi: firma.sonrakiEgitimTarihi || '',
      sonrakiRiskDegerlendirmeTarihi: firma.sonrakiRiskDegerlendirmeTarihi || '',
      sonrakiTatbikatTarihi: firma.sonrakiTatbikatTarihi || ''
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.firmaAdi) return

    try {
      setSaving(true)
      if (editMode && editingId) {
        await isGuvenligiFirmaService.update(editingId, formData)
      } else {
        await isGuvenligiFirmaService.create(formData)
      }
      await loadFirmalar()
      setDialogOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.error?.message || (editMode ? 'Firma güncellenirken bir hata oluştu' : 'Firma oluşturulurken bir hata oluştu'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (firma: IsGuvenligiFirma) => {
    if (!confirm(`"${firma.firmaAdi}" firmasını silmek istediğinize emin misiniz?`)) return
    try {
      await isGuvenligiFirmaService.delete(firma.documentId)
      await loadFirmalar()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Firma silinirken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h4' sx={{ mb: 1 }}>
                Firmalar
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                İş güvenliği hizmeti verdiğiniz firmaları yönetin
              </Typography>
            </Box>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleOpenNewDialog}>
              Firma Ekle
            </Button>
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {firmalar.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  Henüz firma eklenmemiş
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          firmalar.map(firma => (
            <Grid item xs={12} sm={6} md={4} key={firma.documentId}>
              <Card>
                <CardHeader
                  title={firma.firmaAdi}
                  subheader={firma.yetkiliKisi || 'Yetkili kişi belirtilmemiş'}
                  action={
                    <Box>
                      <IconButton size='small' color='primary' onClick={() => handleEdit(firma)}>
                        <i className='tabler-edit' />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleDelete(firma)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant='body2' color='text.secondary'>
                      <i className='tabler-phone' style={{ marginRight: 6 }} />
                      {firma.telefon || '-'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                      <Chip size='small' label={`${firma.calisanSayisi || 0} çalışan`} />
                      <Chip size='small' color='success' label={`${firma.aktifCalisanSayisi || 0} aktif`} />
                      <Chip size='small' color='default' label={`${firma.pasifCalisanSayisi || 0} pasif`} />
                    </Box>
                    <Typography variant='caption' color='text.secondary'>
                      Son sağlık kontrolü: {firma.sonSaglikKontrolTarihi ? new Date(firma.sonSaglikKontrolTarihi).toLocaleDateString('tr-TR') : '-'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Son eğitim: {firma.sonEgitimTarihi ? new Date(firma.sonEgitimTarihi).toLocaleDateString('tr-TR') : '-'}
                    </Typography>
                    <Button
                      component={Link}
                      href={`/is-guvenligi/firmalar/${firma.documentId}`}
                      variant='outlined'
                      size='small'
                      sx={{ mt: 2 }}
                    >
                      Detayı Görüntüle
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editMode ? 'Firma Düzenle' : 'Yeni Firma Ekle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Firma Adı'
                required
                value={formData.firmaAdi}
                onChange={e => setFormData({ ...formData, firmaAdi: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Yetkili Kişi'
                value={formData.yetkiliKisi}
                onChange={e => setFormData({ ...formData, yetkiliKisi: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Telefon'
                value={formData.telefon}
                onChange={e => setFormData({ ...formData, telefon: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type='number'
                label='Çalışan Sayısı'
                value={formData.calisanSayisi}
                onChange={e => setFormData({ ...formData, calisanSayisi: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type='number'
                label='Aktif Çalışan'
                value={formData.aktifCalisanSayisi}
                onChange={e => setFormData({ ...formData, aktifCalisanSayisi: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type='number'
                label='Pasif Çalışan'
                value={formData.pasifCalisanSayisi}
                onChange={e => setFormData({ ...formData, pasifCalisanSayisi: Number(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mt: 1 }}>
                Sağlık Muayenesi
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='date'
                label='Son Sağlık Kontrol Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.sonSaglikKontrolTarihi}
                onChange={e => setFormData({ ...formData, sonSaglikKontrolTarihi: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='date'
                label='Sonraki Sağlık Kontrol Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.sonrakiSaglikKontrolTarihi}
                onChange={e => setFormData({ ...formData, sonrakiSaglikKontrolTarihi: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mt: 1 }}>
                İş Güvenliği Eğitimi
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='date'
                label='Son Eğitim Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.sonEgitimTarihi}
                onChange={e => setFormData({ ...formData, sonEgitimTarihi: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='date'
                label='Sonraki Eğitim Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.sonrakiEgitimTarihi}
                onChange={e => setFormData({ ...formData, sonrakiEgitimTarihi: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='date'
                label='Sonraki Risk Değerlendirme Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.sonrakiRiskDegerlendirmeTarihi}
                onChange={e => setFormData({ ...formData, sonrakiRiskDegerlendirmeTarihi: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='date'
                label='Sonraki Acil Durum Tatbikatı Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.sonrakiTatbikatTarihi}
                onChange={e => setFormData({ ...formData, sonrakiTatbikatTarihi: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSubmit} variant='contained' disabled={saving || !formData.firmaAdi}>
            {saving ? (editMode ? 'Güncelleniyor...' : 'Kaydediliyor...') : editMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default IsGuvenligiFirmalarPage
