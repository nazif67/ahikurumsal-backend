'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Alert
} from '@mui/material'

// Axios Import
import { axiosClient } from '@/libs/axios'
import { authService } from '@/services/auth.service'

interface Worker {
  id: number
  documentId: string
  firstName: string
  lastName: string
  email: string
  position?: {
    id: number
    name: string
  }
  hasHumanResources: boolean
  hasPdks: boolean
  hasInstitutionManagement: boolean
  hasPurchasing: boolean
  hasAllModules: boolean
}

const CompanySettingsPage = () => {
  // States
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')

  const companyProfile = authService.getCompanyProfile()

  // Fetch workers
  const fetchWorkers = async () => {
    try {
      if (!companyProfile) {
        setError('Şirket profili bulunamadı')
        return
      }

      const response = await axiosClient.get('/api/workers', {
        params: {
          'filters[company][id]': companyProfile.id,
          'filters[isActive]': true,
          'populate': ['position']
        }
      })

      setWorkers(response.data.data)
    } catch (error) {
      console.error('Çalışanlar yüklenirken hata oluştu:', error)
      setError('Çalışanlar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  const handleOpenDialog = () => {
    setDialogOpen(true)
    setSelectedWorker('')
    setSelectedModule('')
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedWorker('')
    setSelectedModule('')
  }

  const handleAssignRole = async () => {
    if (!selectedWorker || !selectedModule) {
      setError('Lütfen çalışan ve modül seçiniz')
      return
    }

    try {
      const updateData: any = {}
      
      if (selectedModule === 'all') {
        updateData.hasAllModules = true
        updateData.hasHumanResources = true
        updateData.hasPdks = true
        updateData.hasInstitutionManagement = true
        updateData.hasPurchasing = true
      } else {
        updateData[selectedModule] = true
      }

      await axiosClient.put(`/api/workers/${selectedWorker}`, {
        data: updateData
      })

      // Refresh the list
      fetchWorkers()
      handleCloseDialog()
      setError(null)
    } catch (error) {
      console.error('Rol atanırken hata oluştu:', error)
      setError('Rol atanırken bir hata oluştu')
    }
  }

  const handleRemoveRole = async (workerId: string, moduleKey: string) => {
    try {
      const updateData: any = {}
      
      if (moduleKey === 'hasAllModules') {
        updateData.hasAllModules = false
        updateData.hasHumanResources = false
        updateData.hasPdks = false
        updateData.hasInstitutionManagement = false
        updateData.hasPurchasing = false
      } else {
        updateData[moduleKey] = false
      }

      await axiosClient.put(`/api/workers/${workerId}`, {
        data: updateData
      })

      // Refresh the list
      fetchWorkers()
      setError(null)
    } catch (error) {
      console.error('Rol kaldırılırken hata oluştu:', error)
      setError('Rol kaldırılırken bir hata oluştu')
    }
  }

  const getModuleChips = (worker: Worker) => {
    const chips = []

    if (worker.hasAllModules) {
      chips.push(
        <Chip
          key="all"
          label="Tüm Modüller"
          color="primary"
          size="small"
          onDelete={() => handleRemoveRole(worker.documentId, 'hasAllModules')}
          sx={{ mr: 1, mb: 1 }}
        />
      )
    } else {
      if (worker.hasHumanResources) {
        chips.push(
          <Chip
            key="hr"
            label="İnsan Kaynakları"
            color="info"
            size="small"
            onDelete={() => handleRemoveRole(worker.documentId, 'hasHumanResources')}
            sx={{ mr: 1, mb: 1 }}
          />
        )
      }
      if (worker.hasPdks) {
        chips.push(
          <Chip
            key="pdks"
            label="QR Giriş-Çıkış"
            color="success"
            size="small"
            onDelete={() => handleRemoveRole(worker.documentId, 'hasPdks')}
            sx={{ mr: 1, mb: 1 }}
          />
        )
      }
      if (worker.hasInstitutionManagement) {
        chips.push(
          <Chip
            key="institution"
            label="Kurum Yönetimi"
            color="secondary"
            size="small"
            onDelete={() => handleRemoveRole(worker.documentId, 'hasInstitutionManagement')}
            sx={{ mr: 1, mb: 1 }}
          />
        )
      }
      if (worker.hasPurchasing) {
        chips.push(
          <Chip
            key="purchasing"
            label="Satın Alma"
            color="warning"
            size="small"
            onDelete={() => handleRemoveRole(worker.documentId, 'hasPurchasing')}
            sx={{ mr: 1, mb: 1 }}
          />
        )
      }
    }

    return chips.length > 0 ? chips : <Typography variant="caption" color="text.secondary">Rol atanmamış</Typography>
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Yükleniyor...</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='h5' color='text.primary'>
                  Çalışan Rol Yönetimi
                </Typography>
                <Button
                  variant='contained'
                  startIcon={<i className='tabler-plus' />}
                  onClick={handleOpenDialog}
                >
                  Yeni Rol Ataması
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
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Çalışan</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Pozisyon</TableCell>
                      <TableCell>Atanmış Roller</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align='center'>
                          <Typography variant='body2' color='text.secondary'>
                            Henüz çalışan bulunmamaktadır.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      workers.map(worker => (
                        <TableRow key={worker.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight={500}>
                              {worker.firstName} {worker.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' color='text.secondary'>
                              {worker.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {worker.position?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                              {getModuleChips(worker)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>Yeni Rol Ataması</Typography>
            <IconButton size='small' onClick={handleCloseDialog}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label='Çalışan Seçin'
                value={selectedWorker}
                onChange={e => setSelectedWorker(e.target.value)}
              >
                <MenuItem value=''>Seçiniz...</MenuItem>
                {workers.map(worker => (
                  <MenuItem key={worker.documentId} value={worker.documentId}>
                    {worker.firstName} {worker.lastName} - {worker.email}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label='Modül Seçin'
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
              >
                <MenuItem value=''>Seçiniz...</MenuItem>
                <MenuItem value='hasHumanResources'>İnsan Kaynakları</MenuItem>
                <MenuItem value='hasPdks'>QR Giriş-Çıkış</MenuItem>
                <MenuItem value='hasInstitutionManagement'>Kurum Yönetimi</MenuItem>
                <MenuItem value='hasPurchasing'>Satın Alma</MenuItem>
                <MenuItem value='all'>Tüm Modüller</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            İptal
          </Button>
          <Button onClick={handleAssignRole} variant='contained' color='primary'>
            Atama Yap
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CompanySettingsPage

