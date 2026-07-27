'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

// Services
import { isGuvenligiFirmaService, type IsGuvenligiFirma } from '@/services/is-guvenligi-firma.service'

// Platform admin için salt okunur oversight ekranı — tüm İş Güvenliği firmalarının
// eklediği müşteri firmaları, hangi İş Güvenliği hesabına ait olduğuyla birlikte listeler.
const IsGuvenligiFirmalariAdminPage = () => {
  const [firmalar, setFirmalar] = useState<IsGuvenligiFirma[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setFirmalar(await isGuvenligiFirmaService.getAll())
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Firmalar yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader
        title='İş Güvenliği Firmaları'
        subheader='İş güvenliği firmalarının kendi panellerinden eklediği müşteri firmaların salt okunur listesi'
      />
      <CardContent>
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {firmalar.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
            Henüz hiçbir iş güvenliği firması müşteri firma eklememiş
          </Typography>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Firma Adı</TableCell>
                  <TableCell>Yetkili Kişi</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell align='center'>Çalışan</TableCell>
                  <TableCell>İş Güvenliği Firması (Ekleyen Hesap)</TableCell>
                  <TableCell>Eklenme Tarihi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {firmalar.map(firma => (
                  <TableRow key={firma.documentId}>
                    <TableCell>{firma.firmaAdi}</TableCell>
                    <TableCell>{firma.yetkiliKisi || '-'}</TableCell>
                    <TableCell>{firma.telefon || '-'}</TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Chip size='small' label={`${firma.calisanSayisi || 0} toplam`} />
                        <Chip size='small' color='success' label={`${firma.aktifCalisanSayisi || 0} aktif`} />
                      </Box>
                    </TableCell>
                    <TableCell>{firma.owner?.username || firma.owner?.email || '-'}</TableCell>
                    <TableCell>{new Date(firma.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default IsGuvenligiFirmalariAdminPage
