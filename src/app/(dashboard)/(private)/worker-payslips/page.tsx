'use client'

import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from '@mui/material'

// Services
import { ucretPusulasiService, donemEtiketi, type UcretPusulasi } from '@/services/ucret-pusulasi.service'

const WorkerPayslipsPage = () => {
  const [pusulalar, setPusulalar] = useState<UcretPusulasi[]>([])
  const [loading, setLoading] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [basari, setBasari] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  const [onaylanacak, setOnaylanacak] = useState<UcretPusulasi | null>(null)
  const [onaylaniyor, setOnaylaniyor] = useState(false)
  const [itirazAcik, setItirazAcik] = useState(false)

  useEffect(() => {
    yukle()
  }, [])

  const yukle = async () => {
    try {
      setLoading(true)
      setHata(null)
      setPusulalar(await ucretPusulasiService.benimPusulalarim())
    } catch (err: any) {
      setHata(err.response?.data?.error?.message || 'Ücret pusulaları yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const onayla = async () => {
    if (!onaylanacak) return

    setOnaylaniyor(true)

    try {
      await ucretPusulasiService.onayla(onaylanacak.id)
      setPusulalar(prev =>
        prev.map(p =>
          p.id === onaylanacak.id
            ? { ...p, calisanOnayDurumu: 'onaylandi', calisanOnayAt: new Date().toISOString() }
            : p
        )
      )
      setBasari('Ücret pusulanız onaylandı. "Onayladıklarım" sekmesinden görüntüleyebilirsiniz.')
      setOnaylanacak(null)
    } catch (err: any) {
      setHata(err.response?.data?.error?.message || 'Onay kaydedilemedi')
    } finally {
      setOnaylaniyor(false)
    }
  }

  const bekleyenler = useMemo(() => pusulalar.filter(p => p.calisanOnayDurumu !== 'onaylandi'), [pusulalar])
  const onaylananlar = useMemo(() => pusulalar.filter(p => p.calisanOnayDurumu === 'onaylandi'), [pusulalar])

  const gosterilen = tab === 0 ? bekleyenler : onaylananlar

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
        <Typography variant='h4' sx={{ mb: 1 }}>
          Ücret Pusulalarım
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Aylık ücret pusulalarınızı buradan görüntüleyip onaylayabilirsiniz. Pusulalarınızı yalnızca siz
          görebilirsiniz.
        </Typography>
      </Grid>

      {hata && (
        <Grid item xs={12}>
          <Alert severity='error' onClose={() => setHata(null)}>
            {hata}
          </Alert>
        </Grid>
      )}

      {basari && (
        <Grid item xs={12}>
          <Alert severity='success' onClose={() => setBasari(null)}>
            {basari}
          </Alert>
        </Grid>
      )}

      {bekleyenler.length > 0 && (
        <Grid item xs={12}>
          <Alert severity='info'>
            <AlertTitle>Onayınızı bekleyen {bekleyenler.length} ücret pusulası var</AlertTitle>
            Pusulayı açıp inceledikten sonra onaylayın. Tutarlarda bir sorun görüyorsanız onaylamayın ve insan
            kaynakları yetkilinizle görüşün.
          </Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Pusulalarım'
            action={
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label={`Onay Bekleyenler (${bekleyenler.length})`} />
                <Tab label={`Onayladıklarım (${onaylananlar.length})`} />
              </Tabs>
            }
          />
          <CardContent>
            {gosterilen.length > 0 ? (
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Dönem</TableCell>
                      <TableCell>Gönderim Tarihi</TableCell>
                      <TableCell align='center'>Durum</TableCell>
                      <TableCell align='right'>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gosterilen.map(pusula => (
                      <TableRow key={pusula.id} hover>
                        <TableCell>
                          <Typography variant='body1' sx={{ fontWeight: 600 }}>
                            {donemEtiketi(pusula.donemYil, pusula.donemAy)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {pusula.gonderildiAt ? new Date(pusula.gonderildiAt).toLocaleDateString('tr-TR') : '—'}
                        </TableCell>
                        <TableCell align='center'>
                          {pusula.calisanOnayDurumu === 'onaylandi' ? (
                            <Chip
                              size='small'
                              color='success'
                              label={
                                pusula.calisanOnayAt
                                  ? `Onaylandı · ${new Date(pusula.calisanOnayAt).toLocaleDateString('tr-TR')}`
                                  : 'Onaylandı'
                              }
                            />
                          ) : (
                            <Chip size='small' color='warning' label='Onayınız bekleniyor' />
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Stack direction='row' spacing={2} justifyContent='flex-end'>
                            <Button
                              size='small'
                              variant='outlined'
                              startIcon={<i className='tabler-file-text' />}
                              onClick={() => ucretPusulasiService.dosyaAc(pusula.id)}
                            >
                              Görüntüle
                            </Button>
                            {pusula.calisanOnayDurumu !== 'onaylandi' && (
                              <Button size='small' variant='contained' onClick={() => setOnaylanacak(pusula)}>
                                Onayla
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant='body1' color='text.secondary'>
                  {tab === 0 ? 'Onayınızı bekleyen ücret pusulası yok' : 'Henüz onayladığınız pusula yok'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Onay dialogu */}
      <Dialog open={!!onaylanacak} onClose={() => setOnaylanacak(null)} fullWidth maxWidth='sm'>
        <DialogTitle>Ücret Pusulasını Onayla</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            <strong>{onaylanacak && donemEtiketi(onaylanacak.donemYil, onaylanacak.donemAy)}</strong> dönemine ait ücret
            pusulanızı onaylıyorsunuz. Onayladığınızda pusula &quot;Onayladıklarım&quot; sekmesine taşınır.
          </DialogContentText>
          <Alert severity='warning'>
            Pusulayı incelemeden onaylamayın. <strong>Eğer kabul etmiyorsanız</strong>, onaylamayın ve insan kaynakları
            yetkilinizle görüşün.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setOnaylanacak(null)}>
            Vazgeç
          </Button>
          <Button
            color='warning'
            onClick={() => {
              setOnaylanacak(null)
              setItirazAcik(true)
            }}
          >
            Kabul Etmiyorum
          </Button>
          <Button variant='contained' onClick={onayla} disabled={onaylaniyor}>
            {onaylaniyor ? <CircularProgress size={22} /> : 'Onaylıyorum'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* İtiraz yönlendirmesi */}
      <Dialog open={itirazAcik} onClose={() => setItirazAcik(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Pusulayı kabul etmiyorsunuz</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 3 }}>
            Ücret pusulanızı kabul etmiyorsanız lütfen <strong>insan kaynakları yetkilinizle görüşün</strong>.
          </Alert>
          <DialogContentText>
            Pusula onaylanmadan &quot;Onay Bekleyenler&quot; sekmesinde kalır. İtirazınız değerlendirildikten sonra
            yetkiliniz gerekirse pusulayı yeniden gönderecektir.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='contained' onClick={() => setItirazAcik(false)}>
            Anladım
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default WorkerPayslipsPage
