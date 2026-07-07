'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

// Services
import { reminderService, type Reminder } from '@/services/reminder.service'

const RemindersPage = () => {
  // States
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    reminderDate: string
    reminderType: 'custom' | 'dask_policy' | 'vehicle_insurance' | 'vehicle_inspection'
    phoneNumber: string
    message: string
  }>({
    title: '',
    description: '',
    reminderDate: '',
    reminderType: 'custom',
    phoneNumber: '',
    message: ''
  })
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Effects
  useEffect(() => {
    loadReminders()
  }, [])

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredReminders(reminders)
    } else {
      setFilteredReminders(reminders.filter(reminder => reminder.reminderType === selectedType))
    }
  }, [reminders, selectedType])

  // Handlers
  const loadReminders = async () => {
    try {
      setLoading(true)
      const data = await reminderService.getAll()
      setReminders(data)
      setError(null)
    } catch (err: any) {
      console.error('Load reminders error:', err)
      setError(err.response?.data?.error?.message || 'Anımsatıcılar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setEditMode(false)
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      reminderDate: '',
      reminderType: 'custom',
      phoneNumber: '',
      message: ''
    })
    setDialogOpen(true)
  }

  const handleEdit = (reminder: Reminder) => {
    setEditMode(true)
    setEditingId(reminder.documentId)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminderDate: reminder.reminderDate ? new Date(reminder.reminderDate).toISOString().split('T')[0] : '',
      reminderType: reminder.reminderType,
      phoneNumber: reminder.phoneNumber || '',
      message: reminder.message || ''
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      if (editMode && editingId) {
        await reminderService.update(editingId, formData)
      } else {
        await reminderService.create(formData)
      }
      
      await loadReminders()
      handleCloseDialog()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || (editMode ? 'Anımsatıcı güncellenirken bir hata oluştu' : 'Anımsatıcı oluşturulurken bir hata oluştu'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu anımsatıcıyı silmek istediğinize emin misiniz?')) return

    try {
      await reminderService.delete(id)
      await loadReminders()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Anımsatıcı silinirken bir hata oluştu')
    }
  }

  const handleSendWhatsApp = async (id: string) => {
    if (!confirm('Bu anımsatıcı için WhatsApp mesajı göndermek istiyor musunuz?')) return

    try {
      const result = await reminderService.sendWhatsApp(id)
      alert(result.message)
      await loadReminders()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'WhatsApp mesajı gönderilirken bir hata oluştu')
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const result = await reminderService.syncReminders()
      alert(result.message)
      await loadReminders()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Senkronizasyon sırasında bir hata oluştu')
    } finally {
      setSyncing(false)
    }
  }

  const getReminderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dask_policy: 'DASK Poliçesi',
      vehicle_insurance: 'Araç Sigortası',
      vehicle_inspection: 'Araç Muayenesi',
      custom: 'Özel'
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Beklemede',
      sent: 'Gönderildi',
      failed: 'Başarısız'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): 'default' | 'success' | 'error' | 'warning' => {
    const colors: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
      pending: 'warning',
      sent: 'success',
      failed: 'error'
    }
    return colors[status] || 'default'
  }

  const isUpcoming = (date: string) => {
    const reminderDate = new Date(date)
    const today = new Date()
    const diffDays = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 30
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Anımsatıcılar"
          subheader="DASK, sigorta ve muayene tarihlerini takip edin, WhatsApp ile hatırlatma gönderin"
          action={
            <Box display="flex" gap={2} alignItems="center">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Anımsatıcı Tipi</InputLabel>
                <Select
                  value={selectedType}
                  label="Anımsatıcı Tipi"
                  onChange={(e) => setSelectedType(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="dask_policy">DASK Poliçesi</MenuItem>
                  <MenuItem value="vehicle_insurance">Araç Sigortası</MenuItem>
                  <MenuItem value="vehicle_inspection">Araç Muayenesi</MenuItem>
                  <MenuItem value="custom">Özel</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleSync}
                disabled={syncing}
                startIcon={<i className="tabler-refresh" />}
              >
                {syncing ? 'Senkronize ediliyor...' : 'Senkronize Et'}
              </Button>
              <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                + Yeni Anımsatıcı
              </Button>
            </Box>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Tip</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>İlgili</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReminders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={5}>
                        <Typography variant="body1" color="text.secondary">
                          {reminders.length === 0 
                            ? 'Henüz anımsatıcı eklenmemiş' 
                            : 'Bu filtreye uygun anımsatıcı bulunamadı'}
                        </Typography>
                        {reminders.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            &quot;Senkronize Et&quot; butonuna tıklayarak mevcut konut ve araç tarihlerinden otomatik anımsatıcılar oluşturabilirsiniz.
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReminders.map((reminder) => (
                    <TableRow 
                      key={reminder.id}
                      sx={{
                        bgcolor: isUpcoming(reminder.reminderDate) ? 'warning.lighter' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {reminder.title}
                        </Typography>
                        {reminder.description && (
                          <Typography variant="caption" color="text.secondary">
                            {reminder.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getReminderTypeLabel(reminder.reminderType)} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(reminder.reminderDate).toLocaleDateString('tr-TR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(reminder.status)} 
                          size="small" 
                          color={getStatusColor(reminder.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {reminder.phoneNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {reminder.relatedProperty && (
                          <Typography variant="caption" display="block">
                            🏠 {reminder.relatedProperty.institution?.name || 'Konut'}
                          </Typography>
                        )}
                        {reminder.relatedVehicle && (
                          <Typography variant="caption" display="block">
                            🚗 {reminder.relatedVehicle.plateNumber}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          {reminder.phoneNumber && reminder.status !== 'sent' && (
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => handleSendWhatsApp(reminder.documentId)}
                              title="WhatsApp Gönder"
                            >
                              <i className="tabler-brand-whatsapp" />
                            </IconButton>
                          )}
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleEdit(reminder)}
                          >
                            <i className="tabler-edit" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(reminder.documentId)}
                          >
                            <i className="tabler-trash" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Anımsatıcı Düzenle' : 'Yeni Anımsatıcı Ekle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Başlık"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Anımsatıcı başlığı"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaylı açıklama (opsiyonel)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tip</InputLabel>
                <Select
                  value={formData.reminderType}
                  label="Tip"
                  onChange={(e) => setFormData({ ...formData, reminderType: e.target.value as any })}
                >
                  <MenuItem value="custom">Özel</MenuItem>
                  <MenuItem value="dask_policy">DASK Poliçesi</MenuItem>
                  <MenuItem value="vehicle_insurance">Araç Sigortası</MenuItem>
                  <MenuItem value="vehicle_inspection">Araç Muayenesi</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Hatırlatma Tarihi"
                type="date"
                value={formData.reminderDate}
                onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon Numarası"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="05551234567"
                helperText="WhatsApp için (opsiyonel)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="WhatsApp Mesajı"
                multiline
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Gönderilecek mesaj içeriği (opsiyonel, boş bırakılırsa otomatik oluşturulur)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving || !formData.title || !formData.reminderDate}>
            {saving ? (editMode ? 'Güncelleniyor...' : 'Kaydediliyor...') : (editMode ? 'Güncelle' : 'Kaydet')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RemindersPage


