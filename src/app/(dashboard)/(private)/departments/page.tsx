'use client'

import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import {
  Card, CardContent, Button, Grid, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Typography, Box, Chip, Divider,
  MenuItem, Alert, Tooltip, CircularProgress, InputAdornment, ToggleButton,
  ToggleButtonGroup, Switch, FormControlLabel, LinearProgress
} from '@mui/material'

// Services
import { departmentService, type Department, type CreateDepartmentDTO } from '@/services/department.service'
import { branchService, type Branch } from '@/services/branch.service'
import { workersService, type WorkerOption } from '@/services/workers.service'

const EMPTY_FORM: CreateDepartmentDTO = {
  key: '',
  name: '',
  description: '',
  costCenter: '',
  email: '',
  phone: '',
  headcountTarget: null,
  isActive: true,
  branchId: null,
  managerId: null
}

// Tek tıkla oluşturulabilen standart departman seti
const DEFAULT_DEPARTMENTS = [
  { key: 'ik', name: 'İnsan Kaynakları' },
  { key: 'muhasebe', name: 'Muhasebe / Finans' },
  { key: 'satis', name: 'Satış' },
  { key: 'pazarlama', name: 'Pazarlama' },
  { key: 'uretim', name: 'Üretim' },
  { key: 'bt', name: 'Bilgi Teknolojileri' },
  { key: 'idari', name: 'İdari İşler' }
]

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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [workers, setWorkers] = useState<WorkerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [formError, setFormError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [detailDepartment, setDetailDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState<CreateDepartmentDTO>(EMPTY_FORM)

  useEffect(() => {
    fetchDepartments()
    branchService
      .getBranches()
      .then(res => setBranches(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBranches([]))
    workersService.getWorkerOptions().then(setWorkers)
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setErrorMsg('')

      const response = await departmentService.getDepartments()

      setDepartments(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      console.error('Departmanlar yüklenirken hata:', error)
      setErrorMsg(error?.response?.data?.error?.message || 'Departmanlar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const activeDepartments = departments.filter(d => d.isActive !== false).length
    const totalWorkers = departments.reduce((sum, d) => sum + (d.activeWorkerCount || 0), 0)
    const withoutManager = departments.filter(d => !d.manager).length

    return { total: departments.length, activeDepartments, totalWorkers, withoutManager }
  }, [departments])

  const visibleDepartments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return departments.filter(department => {
      if (statusFilter === 'active' && department.isActive === false) return false
      if (statusFilter === 'passive' && department.isActive !== false) return false

      if (!term) return true

      return [department.name, department.key, department.costCenter, department.branch?.name]
        .filter(Boolean)
        .some(field => String(field).toLocaleLowerCase('tr-TR').includes(term))
    })
  }, [departments, search, statusFilter])

  const handleOpenDialog = (department?: Department) => {
    setFormError('')

    if (department) {
      setEditMode(true)
      setSelectedDepartment(department)
      setFormData({
        key: department.key || '',
        name: department.name || '',
        description: department.description || '',
        costCenter: department.costCenter || '',
        email: department.email || '',
        phone: department.phone || '',
        headcountTarget: department.headcountTarget ?? null,
        isActive: department.isActive !== false,
        branchId: department.branch?.id ?? null,
        managerId: department.manager?.id ?? null
      })
    } else {
      setEditMode(false)
      setSelectedDepartment(null)
      setFormData(EMPTY_FORM)
    }

    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditMode(false)
    setSelectedDepartment(null)
    setFormData(EMPTY_FORM)
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!formData.key.trim() || !formData.name.trim()) {
      setFormError('Departman kodu ve adı zorunludur')

      return
    }

    try {
      setSaving(true)
      setFormError('')

      const payload: CreateDepartmentDTO = {
        ...formData,
        key: formData.key.trim(),
        name: formData.name.trim()
      }

      if (editMode && selectedDepartment) {
        await departmentService.updateDepartment(selectedDepartment.documentId, payload)
      } else {
        await departmentService.createDepartment(payload)
      }

      handleCloseDialog()
      fetchDepartments()
    } catch (error: any) {
      console.error('Departman kaydedilirken hata:', error)
      setFormError(error?.response?.data?.error?.message || 'Departman kaydedilirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (department: Department) => {
    if (!confirm(`"${department.name}" departmanını silmek istediğinizden emin misiniz?`)) return

    try {
      await departmentService.deleteDepartment(department.documentId)
      fetchDepartments()
    } catch (error: any) {
      console.error('Departman silinirken hata:', error)
      alert(error?.response?.data?.error?.message || 'Departman silinirken bir hata oluştu')
    }
  }

  /** Standart departman setini şirkete ekler (var olanları atlar) */
  const handleSeedDefaults = async () => {
    const existingKeys = new Set(departments.map(d => d.key))
    const missing = DEFAULT_DEPARTMENTS.filter(d => !existingKeys.has(d.key))

    if (missing.length === 0) return

    try {
      setSeeding(true)

      for (const item of missing) {
        await departmentService.createDepartment({ ...EMPTY_FORM, key: item.key, name: item.name })
      }

      fetchDepartments()
    } catch (error: any) {
      console.error('Varsayılan departmanlar eklenemedi:', error)
      setErrorMsg(error?.response?.data?.error?.message || 'Varsayılan departmanlar eklenirken bir hata oluştu')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='h4'>Departmanlarım</Typography>
            <Typography variant='body2' color='text.secondary'>
              Organizasyon şemanızı, departman yöneticilerini ve kadro dağılımını yönetin.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {departments.length === 0 && (
              <Button
                variant='outlined'
                onClick={handleSeedDefaults}
                disabled={seeding}
                startIcon={<i className='tabler-wand' />}
              >
                {seeding ? 'Ekleniyor...' : 'Varsayılan Departmanları Ekle'}
              </Button>
            )}
            <Button variant='contained' onClick={() => handleOpenDialog()} startIcon={<i className='tabler-plus' />}>
              Yeni Departman Ekle
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Özet kutucukları */}
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Toplam Departman' value={stats.total} icon='tabler-sitemap' color='primary' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Aktif Departman' value={stats.activeDepartments} icon='tabler-circle-check' color='success' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Departmanlı Aktif Çalışan' value={stats.totalWorkers} icon='tabler-users' color='info' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox label='Yöneticisi Atanmamış' value={stats.withoutManager} icon='tabler-user-question' color='warning' />
      </Grid>

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
              placeholder='Departman adı, kodu, şube, masraf merkezi ara...'
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
              {visibleDepartments.length} kayıt listeleniyor
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Departman kartları */}
      {loading ? (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        </Grid>
      ) : visibleDepartments.length === 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 12 }}>
              <i className='tabler-sitemap' style={{ fontSize: 48, opacity: 0.35 }} />
              <Typography variant='h6' sx={{ mt: 3 }}>
                {departments.length === 0 ? 'Henüz departman tanımlanmamış' : 'Aramanıza uygun departman bulunamadı'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {departments.length === 0
                  ? 'Varsayılan departman setiyle hızlı başlayabilir veya kendi yapınızı kurabilirsiniz.'
                  : 'Farklı bir arama terimi veya filtre deneyin.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : (
        visibleDepartments.map(department => {
          const target = department.headcountTarget || 0
          const current = department.activeWorkerCount || 0
          const fillRate = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : null

          return (
            <Grid item xs={12} md={6} lg={4} key={department.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant='h6' sx={{ wordBreak: 'break-word' }}>
                        {department.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip size='small' variant='tonal' label={`Kod: ${department.key}`} />
                        <Chip
                          size='small'
                          variant='tonal'
                          color={department.isActive === false ? 'secondary' : 'success'}
                          label={department.isActive === false ? 'Pasif' : 'Aktif'}
                        />
                        {department.branch && (
                          <Chip size='small' variant='tonal' color='info' label={department.branch.name} />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexShrink: 0 }}>
                      <Tooltip title='Detay'>
                        <IconButton size='small' onClick={() => setDetailDepartment(department)}>
                          <i className='tabler-eye' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Düzenle'>
                        <IconButton size='small' color='primary' onClick={() => handleOpenDialog(department)}>
                          <i className='tabler-edit' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Sil'>
                        <IconButton size='small' color='error' onClick={() => handleDelete(department)}>
                          <i className='tabler-trash' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 4 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <InfoBox label='Aktif Çalışan' value={current} icon='tabler-users' highlight={current > 0} />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoBox label='Hedef Kadro' value={target || '-'} icon='tabler-target' />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoBox label='Masraf Merkezi' value={department.costCenter} icon='tabler-receipt' />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoBox label='Bağlı Şube' value={department.branch?.name} icon='tabler-building-store' />
                    </Grid>
                    <Grid item xs={12}>
                      <InfoBox
                        label='Departman Yöneticisi'
                        value={
                          department.manager
                            ? `${department.manager.firstName} ${department.manager.lastName}`
                            : 'Atanmadı'
                        }
                        icon='tabler-user-star'
                      />
                    </Grid>
                  </Grid>

                  {fillRate !== null && (
                    <Box sx={{ mt: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='caption' color='text.secondary'>
                          Kadro doluluk
                        </Typography>
                        <Typography variant='caption' sx={{ fontWeight: 600 }}>
                          %{fillRate}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={fillRate}
                        color={fillRate >= 100 ? 'success' : fillRate >= 60 ? 'primary' : 'warning'}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })
      )}

      {/* Detay dialogu - tüm bilgiler kutucuk olarak */}
      <Dialog open={!!detailDepartment} onClose={() => setDetailDepartment(null)} maxWidth='md' fullWidth>
        <DialogTitle>
          {detailDepartment?.name}
          <Typography variant='body2' color='text.secondary'>
            Departman detay bilgileri
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {detailDepartment && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  KİMLİK
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Departman Kodu' value={detailDepartment.key} icon='tabler-hash' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Departman Adı' value={detailDepartment.name} icon='tabler-sitemap' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox
                  label='Durum'
                  value={detailDepartment.isActive === false ? 'Pasif' : 'Aktif'}
                  icon='tabler-toggle-right'
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  ORGANİZASYON
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Bağlı Şube' value={detailDepartment.branch?.name} icon='tabler-building-store' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox
                  label='Departman Yöneticisi'
                  value={
                    detailDepartment.manager
                      ? `${detailDepartment.manager.firstName} ${detailDepartment.manager.lastName}`
                      : 'Atanmadı'
                  }
                  icon='tabler-user-star'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Masraf Merkezi' value={detailDepartment.costCenter} icon='tabler-receipt' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Toplam Çalışan' value={detailDepartment.workerCount ?? 0} icon='tabler-users' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Aktif Çalışan' value={detailDepartment.activeWorkerCount ?? 0} icon='tabler-user-check' />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBox label='Hedef Kadro' value={detailDepartment.headcountTarget || '-'} icon='tabler-target' />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  İLETİŞİM
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoBox label='Telefon / Dahili' value={detailDepartment.phone} icon='tabler-phone' />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoBox label='E-posta' value={detailDepartment.email} icon='tabler-mail' />
              </Grid>
              <Grid item xs={12}>
                <InfoBox label='Açıklama' value={detailDepartment.description} icon='tabler-notes' />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDepartment(null)}>Kapat</Button>
          <Button
            variant='contained'
            onClick={() => {
              const department = detailDepartment

              setDetailDepartment(null)
              if (department) handleOpenDialog(department)
            }}
          >
            Düzenle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ekle / Düzenle dialogu */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogTitle>{editMode ? 'Departman Düzenle' : 'Yeni Departman Ekle'}</DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity='error' sx={{ mb: 4 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Departman Kodu'
                value={formData.key}
                onChange={e => setFormData({ ...formData, key: e.target.value })}
                required
                helperText='Şirket içi benzersiz kod'
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='Departman Adı'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label='Bağlı Şube'
                value={formData.branchId ?? ''}
                onChange={e => setFormData({ ...formData, branchId: e.target.value ? Number(e.target.value) : null })}
              >
                <MenuItem value=''>Şubeye bağlı değil</MenuItem>
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label='Departman Yöneticisi'
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Masraf Merkezi'
                value={formData.costCenter}
                onChange={e => setFormData({ ...formData, costCenter: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type='number'
                label='Hedef Kadro'
                value={formData.headcountTarget ?? ''}
                onChange={e =>
                  setFormData({ ...formData, headcountTarget: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== false}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label='Departman aktif'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Telefon / Dahili'
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='E-posta'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
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
