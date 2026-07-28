'use client'

import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import {
  Card, CardContent, Button, Grid, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Typography, Box, Chip, Divider,
  MenuItem, Alert, Tooltip, CircularProgress, InputAdornment, ToggleButton,
  ToggleButtonGroup, Switch, FormControlLabel
} from '@mui/material'

// Services
import {
  branchService,
  TEHLIKE_SINIFI_LABELS,
  type Branch,
  type CreateBranchDTO,
  type TehlikeSinifi
} from '@/services/branch.service'
import { workersService, type WorkerOption } from '@/services/workers.service'

const EMPTY_FORM: CreateBranchDTO = {
  key: '',
  name: '',
  description: '',
  address: '',
  city: '',
  district: '',
  phone: '',
  email: '',
  sgkSubeKodu: '',
  sgkSicilNo: '',
  sgkIsyeriUnvani: '',
  naceKodu: '',
  tehlikeSinifi: '',
  openingDate: '',
  isActive: true,
  managerId: null
}

const TEHLIKE_RENK: Record<TehlikeSinifi, 'success' | 'warning' | 'error'> = {
  az_tehlikeli: 'success',
  tehlikeli: 'warning',
  cok_tehlikeli: 'error'
}

const formatDate = (value?: string) => {
  if (!value) return '-'

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('tr-TR')
}

/** Tek bir bilgi kutucuğu */
const InfoBox = ({
  label,
  value,
  icon,
  highlight
}: {
  label: string
  value?: React.ReactNode
  icon?: string
  highlight?: boolean
}) => (
  <Box
    sx={{
      height: '100%',
      p: 3,
      borderRadius: 1,
      border: 1,
      borderColor: highlight ? 'primary.main' : 'divider',
      bgcolor: highlight ? 'var(--mui-palette-primary-lightOpacity)' : 'action.hover'
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {icon && <i className={icon} style={{ fontSize: 16, opacity: 0.7 }} />}
      <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant='body2' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
      {value === null || value === undefined || value === '' ? '-' : value}
    </Typography>
  </Box>
)

/** Sayfa üstündeki özet kutucuğu */
const StatBox = ({
  label,
  value,
  icon,
  color
}: {
  label: string
  value: number | string
  icon: string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.main`,
          color: 'common.white'
        }}
      >
        <i className={icon} style={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography variant='h4' sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [workers, setWorkers] = useState<WorkerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [formError, setFormError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [detailBranch, setDetailBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState<CreateBranchDTO>(EMPTY_FORM)

  useEffect(() => {
    fetchBranches()
    workersService.getWorkerOptions().then(setWorkers)
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const response = await branchService.getBranches()

      setBranches(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      console.error('Şubeler yüklenirken hata:', error)
      setErrorMsg(error?.response?.data?.error?.message || 'Şubeler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const activeBranches = branches.filter(b => b.isActive !== false).length
    const totalWorkers = branches.reduce((sum, b) => sum + (b.activeWorkerCount || 0), 0)
    const missingSgk = branches.filter(b => !b.sgkSubeKodu).length

    return { total: branches.length, activeBranches, totalWorkers, missingSgk }
  }, [branches])

  const visibleBranches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return branches.filter(branch => {
      if (statusFilter === 'active' && branch.isActive === false) return false
      if (statusFilter === 'passive' && branch.isActive !== false) return false

      if (!term) return true

      return [branch.name, branch.key, branch.city, branch.district, branch.sgkSubeKodu, branch.sgkSicilNo]
        .filter(Boolean)
        .some(field => String(field).toLocaleLowerCase('tr-TR').includes(term))
    })
  }, [branches, search, statusFilter])

  const handleOpenDialog = (branch?: Branch) => {
    setFormError('')

    if (branch) {
      setEditMode(true)
      setSelectedBranch(branch)
      setFormData({
        key: branch.key || '',
        name: branch.name || '',
        description: branch.description || '',
        address: branch.address || '',
        city: branch.city || '',
        district: branch.district || '',
        phone: branch.phone || '',
        email: branch.email || '',
        sgkSubeKodu: branch.sgkSubeKodu || '',
        sgkSicilNo: branch.sgkSicilNo || '',
        sgkIsyeriUnvani: branch.sgkIsyeriUnvani || '',
        naceKodu: branch.naceKodu || '',
        tehlikeSinifi: branch.tehlikeSinifi || '',
        openingDate: branch.openingDate || '',
        isActive: branch.isActive !== false,
        managerId: branch.manager?.id ?? null
      })
    } else {
      setEditMode(false)
      setSelectedBranch(null)
      setFormData(EMPTY_FORM)
    }

    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditMode(false)
    setSelectedBranch(null)
    setFormData(EMPTY_FORM)
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!formData.key.trim() || !formData.name.trim()) {
      setFormError('Şube kodu ve şube adı zorunludur')

      return
    }

    try {
      setSaving(true)
      setFormError('')

      const payload: CreateBranchDTO = {
        ...formData,
        key: formData.key.trim(),
        name: formData.name.trim(),
        sgkSubeKodu: formData.sgkSubeKodu?.trim() || '',
        sgkSicilNo: formData.sgkSicilNo?.replace(/[\s-]/g, '') || ''
      }

      if (editMode && selectedBranch) {
        await branchService.updateBranch(selectedBranch.documentId, payload)
      } else {
        await branchService.createBranch(payload)
      }

      handleCloseDialog()
      fetchBranches()
    } catch (error: any) {
      console.error('Şube kaydedilirken hata:', error)
      setFormError(error?.response?.data?.error?.message || 'Şube kaydedilirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`"${branch.name}" şubesini silmek istediğinizden emin misiniz?`)) return

    try {
      await branchService.deleteBranch(branch.documentId)
      fetchBranches()
    } catch (error: any) {
      console.error('Şube silinirken hata:', error)
      alert(error?.response?.data?.error?.message || 'Şube silinirken bir hata oluştu')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='h4'>Şubelerim</Typography>
            <Typography variant='body2' color='text.secondary'>
              Şirketinize ait iş yerlerini, SGK şube kodlarını ve kadro dağılımını takip edin.
            </Typography>
          </Box>
          <Button variant='contained' onClick={() => handleOpenDialog()} startIcon={<i className='tabler-plus' />}>
            Yeni Şube Ekle
          </Button>
        </Box>
      </Grid>

      {/* Özet kutucukları */}
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Toplam Şube' value={stats.total} icon='tabler-building-store' color='primary' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Aktif Şube' value={stats.activeBranches} icon='tabler-circle-check' color='success' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Şubelerdeki Aktif Çalışan' value={stats.totalWorkers} icon='tabler-users' color='info' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='SGK Şube Kodu Eksik' value={stats.missingSgk} icon='tabler-alert-triangle' color='warning' />
      </Grid>

      {stats.missingSgk > 0 && (
        <Grid item xs={12}>
          <Alert severity='warning'>
            {stats.missingSgk} şubede SGK şube kodu tanımlı değil. SGK bildirimlerinin (işe giriş/çıkış, APHB) doğru
            işyeri dosyasına düşmesi için şube kodlarını girin.
          </Alert>
        </Grid>
      )}

      {errorMsg && (
        <Grid item xs={12}>
          <Alert severity='error'>{errorMsg}</Alert>
        </Grid>
      )}

      {/* Filtreler */}
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <TextField
              size='small'
              placeholder='Şube adı, kodu, il, SGK no ara...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 280, flexGrow: 1, maxWidth: 420 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup
              size='small'
              exclusive
              value={statusFilter}
              onChange={(_, value) => value && setStatusFilter(value)}
            >
              <ToggleButton value='all'>Tümü</ToggleButton>
              <ToggleButton value='active'>Aktif</ToggleButton>
              <ToggleButton value='passive'>Pasif</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant='body2' color='text.secondary'>
              {visibleBranches.length} kayıt listeleniyor
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Şube kartları */}
      {loading ? (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        </Grid>
      ) : visibleBranches.length === 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 12 }}>
              <i className='tabler-building-store' style={{ fontSize: 48, opacity: 0.35 }} />
              <Typography variant='h6' sx={{ mt: 3 }}>
                {branches.length === 0 ? 'Henüz şube tanımlanmamış' : 'Aramanıza uygun şube bulunamadı'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {branches.length === 0
                  ? 'Merkez iş yerinizi ekleyerek başlayın; çalışanları şubelere bağlayabilirsiniz.'
                  : 'Farklı bir arama terimi veya filtre deneyin.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : (
        visibleBranches.map(branch => (
          <Grid item xs={12} md={6} lg={4} key={branch.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Başlık */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='h6' sx={{ wordBreak: 'break-word' }}>
                      {branch.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      <Chip size='small' variant='tonal' label={`Kod: ${branch.key}`} />
                      <Chip
                        size='small'
                        variant='tonal'
                        color={branch.isActive === false ? 'secondary' : 'success'}
                        label={branch.isActive === false ? 'Pasif' : 'Aktif'}
                      />
                      {branch.tehlikeSinifi && (
                        <Chip
                          size='small'
                          variant='tonal'
                          color={TEHLIKE_RENK[branch.tehlikeSinifi]}
                          label={TEHLIKE_SINIFI_LABELS[branch.tehlikeSinifi]}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexShrink: 0 }}>
                    <Tooltip title='Detay'>
                      <IconButton size='small' onClick={() => setDetailBranch(branch)}>
                        <i className='tabler-eye' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Düzenle'>
                      <IconButton size='small' color='primary' onClick={() => handleOpenDialog(branch)}>
                        <i className='tabler-edit' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Sil'>
                      <IconButton size='small' color='error' onClick={() => handleDelete(branch)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Bilgi kutucukları */}
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <InfoBox
                      label='SGK Şube Kodu'
                      value={branch.sgkSubeKodu}
                      icon='tabler-id-badge-2'
                      highlight={!!branch.sgkSubeKodu}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoBox label='Aktif Çalışan' value={branch.activeWorkerCount ?? 0} icon='tabler-users' />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoBox label='Departman' value={branch.departmentCount ?? 0} icon='tabler-sitemap' />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoBox
                      label='Konum'
                      value={[branch.district, branch.city].filter(Boolean).join(' / ')}
                      icon='tabler-map-pin'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoBox
                      label='Şube Yöneticisi'
                      value={branch.manager ? `${branch.manager.firstName} ${branch.manager.lastName}` : 'Atanmadı'}
                      icon='tabler-user-star'
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}

      {/* Detay dialogu - tüm bilgiler kutucuk olarak */}
      <Dialog open={!!detailBranch} onClose={() => setDetailBranch(null)} maxWidth='md' fullWidth>
        <DialogTitle>
          {detailBranch?.name}
          <Typography variant='body2' color='text.secondary'>
            Şube detay bilgileri
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {detailBranch && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  KİMLİK
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Şube Kodu' value={detailBranch.key} icon='tabler-hash' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Şube Adı' value={detailBranch.name} icon='tabler-building-store' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox
                  label='Durum'
                  value={detailBranch.isActive === false ? 'Pasif' : 'Aktif'}
                  icon='tabler-toggle-right'
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  SGK / MEVZUAT
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox
                  label='SGK Şube Kodu'
                  value={detailBranch.sgkSubeKodu}
                  icon='tabler-id-badge-2'
                  highlight={!!detailBranch.sgkSubeKodu}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <InfoBox label='SGK İşyeri Sicil No' value={detailBranch.sgkSicilNo} icon='tabler-file-certificate' />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoBox label='SGK İşyeri Unvanı' value={detailBranch.sgkIsyeriUnvani} icon='tabler-writing-sign' />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InfoBox label='NACE / İşkolu Kodu' value={detailBranch.naceKodu} icon='tabler-category' />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InfoBox
                  label='Tehlike Sınıfı'
                  value={detailBranch.tehlikeSinifi ? TEHLIKE_SINIFI_LABELS[detailBranch.tehlikeSinifi] : '-'}
                  icon='tabler-shield-check'
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  İLETİŞİM & ADRES
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Telefon' value={detailBranch.phone} icon='tabler-phone' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='E-posta' value={detailBranch.email} icon='tabler-mail' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Açılış Tarihi' value={formatDate(detailBranch.openingDate)} icon='tabler-calendar' />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoBox label='İl / İlçe' value={[detailBranch.city, detailBranch.district].filter(Boolean).join(' / ')} icon='tabler-map-pin' />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoBox label='Adres' value={detailBranch.address} icon='tabler-map-2' />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  ORGANİZASYON
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <InfoBox label='Toplam Çalışan' value={detailBranch.workerCount ?? 0} icon='tabler-users' />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InfoBox label='Aktif Çalışan' value={detailBranch.activeWorkerCount ?? 0} icon='tabler-user-check' />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InfoBox label='Departman Sayısı' value={detailBranch.departmentCount ?? 0} icon='tabler-sitemap' />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InfoBox
                  label='Şube Yöneticisi'
                  value={
                    detailBranch.manager
                      ? `${detailBranch.manager.firstName} ${detailBranch.manager.lastName}`
                      : 'Atanmadı'
                  }
                  icon='tabler-user-star'
                />
              </Grid>
              <Grid item xs={12}>
                <InfoBox label='Açıklama' value={detailBranch.description} icon='tabler-notes' />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailBranch(null)}>Kapat</Button>
          <Button
            variant='contained'
            onClick={() => {
              const branch = detailBranch

              setDetailBranch(null)
              if (branch) handleOpenDialog(branch)
            }}
          >
            Düzenle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ekle / Düzenle dialogu */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogTitle>{editMode ? 'Şube Düzenle' : 'Yeni Şube Ekle'}</DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity='error' sx={{ mb: 4 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                TEMEL BİLGİLER
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Şube Kodu'
                value={formData.key}
                onChange={e => setFormData({ ...formData, key: e.target.value })}
                required
                helperText='Şirket içi benzersiz kod (ör. MRK, IST-01)'
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='Şube Adı'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                SGK BİLGİLERİ
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='SGK Şube Kodu'
                value={formData.sgkSubeKodu}
                onChange={e => setFormData({ ...formData, sgkSubeKodu: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                helperText='En fazla 4 hane'
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label='SGK İşyeri Sicil No'
                value={formData.sgkSicilNo}
                onChange={e => setFormData({ ...formData, sgkSicilNo: e.target.value.replace(/\D/g, '').slice(0, 26) })}
                helperText='26 haneli sicil no (mahiyet kodu ile başlar)'
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='NACE / İşkolu Kodu'
                value={formData.naceKodu}
                onChange={e => setFormData({ ...formData, naceKodu: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='SGK İşyeri Unvanı'
                value={formData.sgkIsyeriUnvani}
                onChange={e => setFormData({ ...formData, sgkIsyeriUnvani: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label='Tehlike Sınıfı'
                value={formData.tehlikeSinifi || ''}
                onChange={e => setFormData({ ...formData, tehlikeSinifi: e.target.value as TehlikeSinifi | '' })}
              >
                <MenuItem value=''>Seçilmedi</MenuItem>
                <MenuItem value='az_tehlikeli'>Az Tehlikeli</MenuItem>
                <MenuItem value='tehlikeli'>Tehlikeli</MenuItem>
                <MenuItem value='cok_tehlikeli'>Çok Tehlikeli</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                İLETİŞİM & ADRES
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Telefon'
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='E-posta'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type='date'
                label='Açılış Tarihi'
                InputLabelProps={{ shrink: true }}
                value={formData.openingDate || ''}
                onChange={e => setFormData({ ...formData, openingDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='İl'
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='İlçe'
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Adres'
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                ORGANİZASYON
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label='Şube Yöneticisi'
                value={formData.managerId ?? ''}
                onChange={e => setFormData({ ...formData, managerId: e.target.value ? Number(e.target.value) : null })}
              >
                <MenuItem value=''>Atanmadı</MenuItem>
                {workers.map(worker => (
                  <MenuItem key={worker.id} value={worker.id}>
                    {worker.firstName} {worker.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== false}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label='Şube aktif'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSubmit} variant='contained' disabled={saving}>
            {saving ? 'Kaydediliyor...' : editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}
