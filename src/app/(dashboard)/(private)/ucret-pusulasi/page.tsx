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
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'

// Services
import {
  ucretPusulasiService,
  ESLESME_LABELS,
  ESLESME_COLORS,
  AY_ADLARI,
  donemEtiketi,
  type AnalizSonucu,
  type UcretPusulasi
} from '@/services/ucret-pusulasi.service'
import { workersService, type WorkerOption } from '@/services/workers.service'

const YILLAR = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

const UcretPusulasiPage = () => {
  const simdi = new Date()

  const [donemYil, setDonemYil] = useState(simdi.getFullYear())
  const [donemAy, setDonemAy] = useState(simdi.getMonth() + 1)
  const [dosyalar, setDosyalar] = useState<File[]>([])

  const [analiz, setAnaliz] = useState<AnalizSonucu | null>(null)
  const [gecmis, setGecmis] = useState<UcretPusulasi[]>([])
  const [calisanlar, setCalisanlar] = useState<WorkerOption[]>([])

  const [yukleniyor, setYukleniyor] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [basari, setBasari] = useState<string | null>(null)

  const [eslestirilecek, setEslestirilecek] = useState<UcretPusulasi | null>(null)
  const [secilenCalisan, setSecilenCalisan] = useState('')

  useEffect(() => {
    gecmisiYukle()
    workersService.getWorkerOptions().then(setCalisanlar)
  }, [])

  const gecmisiYukle = async () => {
    try {
      const liste = await ucretPusulasiService.listele({ durum: 'gonderildi' })

      setGecmis(liste)
    } catch {
      // geçmiş yüklenemezse ana akış bozulmasın
    }
  }

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDosyalar(Array.from(e.target.files || []))
    setAnaliz(null)
    setHata(null)
    setBasari(null)
  }

  const analizEt = async () => {
    if (dosyalar.length === 0) {
      setHata('Lütfen en az bir PDF seçin')

      return
    }

    setYukleniyor(true)
    setHata(null)
    setBasari(null)

    try {
      const sonuc = await ucretPusulasiService.analiz(dosyalar, donemYil, donemAy)

      setAnaliz(sonuc)
    } catch (err: any) {
      setHata(err.response?.data?.error?.message || 'PDF analiz edilirken bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  const gonder = async () => {
    if (!analiz) return

    setGonderiliyor(true)
    setHata(null)

    try {
      const sonuc = await ucretPusulasiService.gonder(analiz.partiId)

      setBasari(sonuc.mesaj)
      setAnaliz(null)
      setDosyalar([])
      await gecmisiYukle()
    } catch (err: any) {
      setHata(err.response?.data?.error?.message || 'Pusulalar gönderilirken bir hata oluştu')
    } finally {
      setGonderiliyor(false)
    }
  }

  const eslestirmeyiKaydet = async () => {
    if (!eslestirilecek || !secilenCalisan) return

    try {
      await ucretPusulasiService.eslestir(eslestirilecek.id, secilenCalisan)

      const guncel = await ucretPusulasiService.listele({ partiId: analiz!.partiId })

      setAnaliz(prev => (prev ? { ...prev, pusulalar: guncel } : prev))
      setEslestirilecek(null)
      setSecilenCalisan('')
    } catch (err: any) {
      setHata(err.response?.data?.error?.message || 'Eşleştirme kaydedilemedi')
    }
  }

  const pusulaSil = async (pusula: UcretPusulasi) => {
    if (!confirm('Bu sayfa silinsin mi? İşlem geri alınamaz.')) return

    try {
      await ucretPusulasiService.sil(pusula.id)

      if (analiz) {
        setAnaliz({
          ...analiz,
          pusulalar: analiz.pusulalar.filter(p => p.id !== pusula.id),
          toplam: analiz.toplam - 1
        })
      }

      await gecmisiYukle()
    } catch (err: any) {
      setHata(err.response?.data?.error?.message || 'Pusula silinemedi')
    }
  }

  const eslesenler = useMemo(
    () => (analiz?.pusulalar || []).filter(p => p.worker),
    [analiz]
  )

  const eslesmeyenler = useMemo(
    () => (analiz?.pusulalar || []).filter(p => !p.worker),
    [analiz]
  )

  const mukerrerler = useMemo(() => eslesenler.filter(p => p.mevcutPusulaVar), [eslesenler])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ mb: 1 }}>
          Ücret Pusulası Gönderimi
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Bordro PDF&apos;ini yükleyin; sistem her sayfadaki T.C. Kimlik No&apos;yu okuyup pusulayı ilgili çalışana
          ayırır. Siz onaylamadan hiçbir çalışan pusulasını göremez.
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

      {/* 1. Adım — yükleme */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='1. Bordro PDF Yükle' />
          <CardContent>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Dönem Ayı</InputLabel>
                  <Select value={donemAy} label='Dönem Ayı' onChange={e => setDonemAy(Number(e.target.value))}>
                    {AY_ADLARI.map((ad, i) => (
                      <MenuItem key={ad} value={i + 1}>
                        {ad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Dönem Yılı</InputLabel>
                  <Select value={donemYil} label='Dönem Yılı' onChange={e => setDonemYil(Number(e.target.value))}>
                    {YILLAR.map(y => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack direction='row' spacing={2} alignItems='center'>
                  <Button variant='outlined' component='label' startIcon={<i className='tabler-file-upload' />}>
                    PDF Seç
                    <input hidden multiple type='file' accept='application/pdf' onChange={dosyaSec} />
                  </Button>
                  <Typography variant='body2' color='text.secondary'>
                    {dosyalar.length > 0 ? `${dosyalar.length} dosya seçildi` : 'Dosya seçilmedi'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Button variant='contained' onClick={analizEt} disabled={yukleniyor || dosyalar.length === 0}>
                  {yukleniyor ? <CircularProgress size={22} /> : 'PDF’i Oku ve Eşleştir'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 2. Adım — önizleme */}
      {analiz && (
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={`2. Önizleme — ${donemEtiketi(analiz.donemYil, analiz.donemAy)}`}
              subheader={`${analiz.toplam} sayfa okundu · ${eslesenler.length} eşleşti · ${eslesmeyenler.length} eşleşmedi`}
            />
            <CardContent>
              <Alert severity='warning' sx={{ mb: 4 }}>
                <AlertTitle>Göndermeden önce kontrol edin</AlertTitle>
                Aşağıdaki liste hangi sayfanın kime gideceğini gösterir. Eşleşmeyen satırlar gönderilmez. Yanlış bir
                eşleşme görürseniz satırı silin veya çalışanı elle değiştirin — gönderdikten sonra geri alınamaz.
              </Alert>

              {mukerrerler.length > 0 && (
                <Alert severity='info' sx={{ mb: 4 }}>
                  {mukerrerler.length} çalışana bu dönem için daha önce pusula gönderilmiş. Gönderirseniz ikinci bir
                  pusula daha görecekler.
                </Alert>
              )}

              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kaynak / Sayfa</TableCell>
                      <TableCell>Okunan TC</TableCell>
                      <TableCell>Gideceği Çalışan</TableCell>
                      <TableCell>Eşleşme</TableCell>
                      <TableCell align='right'>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analiz.pusulalar.map(pusula => (
                      <TableRow key={pusula.id} hover>
                        <TableCell>
                          <Typography variant='body2'>{pusula.kaynakDosyaAdi}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {pusula.sayfaNo}. sayfa
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' fontFamily='monospace'>
                            {pusula.okunanTcMaskeli || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {pusula.worker ? (
                            <>
                              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                {pusula.worker.firstName} {pusula.worker.lastName}
                              </Typography>
                              <Typography variant='caption' color='text.secondary' fontFamily='monospace'>
                                {pusula.worker.tcKimlikNoMaskeli}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant='body2' color='error.main'>
                              Gönderilmeyecek
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={ESLESME_LABELS[pusula.eslesmeDurumu!]}
                            color={ESLESME_COLORS[pusula.eslesmeDurumu!]}
                          />
                          {pusula.mevcutPusulaVar && (
                            <Chip size='small' sx={{ ml: 1 }} color='info' variant='outlined' label='Mükerrer' />
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Tooltip title='PDF’i aç'>
                            <IconButton size='small' onClick={() => ucretPusulasiService.dosyaAc(pusula.id)}>
                              <i className='tabler-eye' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Çalışanı elle seç'>
                            <IconButton
                              size='small'
                              onClick={() => {
                                setEslestirilecek(pusula)
                                setSecilenCalisan('')
                              }}
                            >
                              <i className='tabler-user-check' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Bu sayfayı sil'>
                            <IconButton size='small' color='error' onClick={() => pusulaSil(pusula)}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 4 }} />

              <Stack direction='row' spacing={3} justifyContent='flex-end' alignItems='center'>
                <Typography variant='body2' color='text.secondary'>
                  {eslesenler.length} pusula gönderilecek
                </Typography>
                <Button color='secondary' onClick={() => setAnaliz(null)}>
                  Vazgeç
                </Button>
                <Button variant='contained' onClick={gonder} disabled={gonderiliyor || eslesenler.length === 0}>
                  {gonderiliyor ? <CircularProgress size={22} /> : 'Onayla ve Çalışanlara Gönder'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Gönderilmiş pusulalar */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Gönderilmiş Pusulalar' subheader={`${gecmis.length} kayıt`} />
          <CardContent>
            {gecmis.length > 0 ? (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Dönem</TableCell>
                      <TableCell>Çalışan</TableCell>
                      <TableCell>Gönderim</TableCell>
                      <TableCell align='center'>Çalışan Onayı</TableCell>
                      <TableCell align='center'>Görüntülendi</TableCell>
                      <TableCell align='right'>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gecmis.map(pusula => (
                      <TableRow key={pusula.id} hover>
                        <TableCell>{donemEtiketi(pusula.donemYil, pusula.donemAy)}</TableCell>
                        <TableCell>
                          {pusula.worker ? `${pusula.worker.firstName} ${pusula.worker.lastName}` : '—'}
                        </TableCell>
                        <TableCell>
                          {pusula.gonderildiAt ? new Date(pusula.gonderildiAt).toLocaleDateString('tr-TR') : '—'}
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            size='small'
                            label={pusula.calisanOnayDurumu === 'onaylandi' ? 'Onaylandı' : 'Bekliyor'}
                            color={pusula.calisanOnayDurumu === 'onaylandi' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          {pusula.ilkGoruntulenmeAt ? (
                            <Tooltip title={new Date(pusula.ilkGoruntulenmeAt).toLocaleString('tr-TR')}>
                              <Chip size='small' color='info' variant='outlined' label={`${pusula.indirmeSayisi} kez`} />
                            </Tooltip>
                          ) : (
                            <Chip size='small' variant='outlined' label='Açılmadı' />
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Tooltip title='PDF’i aç'>
                            <IconButton size='small' onClick={() => ucretPusulasiService.dosyaAc(pusula.id)}>
                              <i className='tabler-eye' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Geri çek ve sil'>
                            <IconButton size='small' color='error' onClick={() => pusulaSil(pusula)}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='body2' color='text.secondary'>
                  Henüz gönderilmiş ücret pusulası yok
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Elle eşleştirme */}
      <Dialog open={!!eslestirilecek} onClose={() => setEslestirilecek(null)} fullWidth maxWidth='sm'>
        <DialogTitle>Çalışanı Elle Seç</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 4 }}>
            Bu sayfayı seçtiğiniz çalışana bağlayacaksınız. Sayfadaki ücret bilgisinin gerçekten bu kişiye ait olduğundan
            emin olun — yanlış seçim ücret gizliliği ihlalidir.
          </Alert>
          <Typography variant='body2' sx={{ mb: 3 }}>
            {eslestirilecek?.kaynakDosyaAdi} · {eslestirilecek?.sayfaNo}. sayfa · Okunan TC:{' '}
            {eslestirilecek?.okunanTcMaskeli || 'yok'}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Çalışan</InputLabel>
            <Select value={secilenCalisan} label='Çalışan' onChange={e => setSecilenCalisan(e.target.value as string)}>
              {calisanlar
                .filter(c => c.isActive && c.documentId)
                .map(c => (
                  <MenuItem key={c.documentId} value={c.documentId}>
                    {c.firstName} {c.lastName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setEslestirilecek(null)}>
            İptal
          </Button>
          <Button variant='contained' disabled={!secilenCalisan} onClick={eslestirmeyiKaydet}>
            Bağla
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default UcretPusulasiPage
