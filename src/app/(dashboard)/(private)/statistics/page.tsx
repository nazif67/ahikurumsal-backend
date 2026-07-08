'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import { Card, CardContent, Grid, Typography, Box, LinearProgress, Alert, AlertTitle } from '@mui/material'

// Component Imports
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Hook Imports
import { formatNumber } from '@core/utils/format'

// Axios Import
import { axiosClient } from '@/libs/axios'
import { authService } from '@/services'

const StatisticsPage = () => {
  // States
  const [workers, setWorkers] = useState({
    total: 0,
    active: 0,
    terminated: 0,
    totalSalary: 0,
    branches: 0,
    departments: 0,
    retired: 0,
    disabled: 0,
    foreigner: 0,
    avgSalary: 0,
    avgWorkYears: 0
  })
  const [departmentStats, setDepartmentStats] = useState<any[]>([])
  const [branchStats, setBranchStats] = useState<any[]>([])
  const [recentHires, setRecentHires] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [awaitingAuthorization, setAwaitingAuthorization] = useState(false)

  // Fetch data
  useEffect(() => {
    // Yeni kayıt olan şirketlerin modül yetkisi admin tarafından sonradan tanımlanır;
    // henüz hiçbir yetki yoksa bilgilendirme göster
    const user = authService.getUser()

    setAwaitingAuthorization(
      authService.isCompany() && !user?.ahiIkMember && !user?.institutionManagementMember
    )

    const fetchData = async () => {
      try {
        // Get company profile
        const companyProfile = authService.getCompanyProfile()
        console.log('📊 Statistics - Company Profile:', companyProfile)

        // Workers data - Backend automatically filters by company
        const workersResponse = await axiosClient.get('/api/workers', {
          params: {
            'pagination[pageSize]': 1000,
            'populate[0]': 'department',
            'populate[1]': 'branch',
            'populate[2]': 'position',
            'populate[3]': 'company'
          }
        })

        console.log('👥 Statistics - Workers Response:', workersResponse.data)
        const workersData = workersResponse.data.data || []
        console.log('👥 Statistics - Workers Count:', workersData.length)
        const totalWorkers = workersData.length
        const activeWorkers = workersData.filter((w: any) => w.isActive).length
        const terminatedWorkers = workersData.filter((w: any) => !w.isActive || w.terminationDate).length
        const totalSalary = workersData.reduce((sum: number, w: any) => sum + (parseFloat(w.salary) || 0), 0)
        
        const uniqueBranches = new Set(workersData.map((w: any) => w.branch?.id).filter(Boolean)).size
        const uniqueDepartments = new Set(workersData.map((w: any) => w.department?.id).filter(Boolean)).size
        
        const retiredWorkers = workersData.filter((w: any) => w.isRetired).length
        const disabledWorkers = workersData.filter((w: any) => w.isDisabled).length
        const foreignWorkers = workersData.filter((w: any) => w.isForeigner).length

        // Calculate average salary
        const avgSalary = activeWorkers > 0 ? totalSalary / activeWorkers : 0

        // Calculate average work years
        const today = new Date()
        const totalWorkYears = workersData
          .filter((w: any) => w.isActive && w.hireDate)
          .reduce((sum: number, w: any) => {
            const hireDate = new Date(w.hireDate)
            const years = (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
            return sum + years
          }, 0)
        const avgWorkYears = activeWorkers > 0 ? totalWorkYears / activeWorkers : 0

        // Department statistics
        const deptStats: any = {}
        workersData.forEach((w: any) => {
          if (w.department && w.isActive) {
            const deptName = w.department.name || 'Tanımsız'
            if (!deptStats[deptName]) {
              deptStats[deptName] = 0
            }
            deptStats[deptName]++
          }
        })
        const departmentStatsArray = Object.entries(deptStats).map(([name, count]) => ({ name, count }))

        // Branch statistics
        const branchStatsMap: any = {}
        workersData.forEach((w: any) => {
          if (w.branch && w.isActive) {
            const branchName = w.branch.name || 'Tanımsız'
            if (!branchStatsMap[branchName]) {
              branchStatsMap[branchName] = 0
            }
            branchStatsMap[branchName]++
          }
        })
        const branchStatsArray = Object.entries(branchStatsMap).map(([name, count]) => ({ name, count }))

        // Recent hires (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentHiresArray = workersData
          .filter((w: any) => w.isActive && w.hireDate && new Date(w.hireDate) >= thirtyDaysAgo)
          .sort((a: any, b: any) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
          .slice(0, 5)

        setWorkers({
          total: totalWorkers,
          active: activeWorkers,
          terminated: terminatedWorkers,
          totalSalary: totalSalary,
          branches: uniqueBranches,
          departments: uniqueDepartments,
          retired: retiredWorkers,
          disabled: disabledWorkers,
          foreigner: foreignWorkers,
          avgSalary: avgSalary,
          avgWorkYears: avgWorkYears
        })

        setDepartmentStats(departmentStatsArray)
        setBranchStats(branchStatsArray)
        setRecentHires(recentHiresArray)
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    <Grid container spacing={6}>
      {/* Yetki bekleyen yeni şirketler için bilgilendirme */}
      {awaitingAuthorization && (
        <Grid item xs={12}>
          <Alert severity='info' icon={<i className='tabler-clock' />}>
            <AlertTitle>Yetki tanımlamanız bekleniyor</AlertTitle>
            Hesabınız başarıyla oluşturuldu. Modül yetkileriniz (AHİ-İK / Kurum Yönetimi) yönetici tarafından en
            kısa sürede tanımlanacaktır. Yetkileriniz tanımlandığında ilgili menüler otomatik olarak aktif olacaktır.
          </Alert>
        </Grid>
      )}

      {/* İstatistik Kartları */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Aktif Çalışan
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {formatNumber(workers.active)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {workers.total} toplam çalışan
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'primary.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-users' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Departman
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {formatNumber(workers.departments)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {workers.branches} şube
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'success.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-building' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Toplam Maaş
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {formatNumber(workers.totalSalary)} ₺
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Aylık ödeme
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'warning.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-currency-lira' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Özel Durumlar
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  Emekli: {workers.retired}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Engelli: {workers.disabled}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Yabancı: {workers.foreigner}
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'info.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-user-check' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Ortalama Maaş */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Ortalama Maaş
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {formatNumber(Math.round(workers.avgSalary))} ₺
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Kişi başı
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'secondary.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-receipt' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Ortalama Kıdem */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Ortalama Kıdem
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {workers.avgWorkYears.toFixed(1)} Yıl
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Çalışma süresi
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'error.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-calendar-stats' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* İşten Ayrılanlar */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  İşten Ayrılan
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {formatNumber(workers.terminated)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Toplam ayrılan
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'grey.500', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-user-x' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Son Eklenen Çalışanlar */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' color='text.primary'>
                  Yeni İşe Alımlar
                </Typography>
                <Typography variant='h4' sx={{ mb: 1 }}>
                  {formatNumber(recentHires.length)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Son 30 gün
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: 'success.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-user-plus' style={{ fontSize: 24, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Departman Bazlı Çalışan Sayıları - 4'lü Grid */}
      <Grid item xs={12}>
        <Typography variant='h5' sx={{ mb: 2, mt: 2 }}>
          Departman Bazlı Çalışan Sayıları
        </Typography>
      </Grid>

      {departmentStats.length > 0 ? (
        departmentStats.map((dept: any, index: number) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant='h6' color='text.primary'>
                      {dept.name}
                    </Typography>
                    <Typography variant='h4' sx={{ mb: 1 }}>
                      {dept.count}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {workers.active > 0 ? `%${((dept.count / workers.active) * 100).toFixed(1)}` : '0%'} oran
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'primary.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className='tabler-users-group' style={{ fontSize: 24, color: 'white' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='body2' color='text.secondary'>
                Henüz departman verisi bulunmuyor
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Şube Bazlı Çalışan Sayıları - 4'lü Grid */}
      <Grid item xs={12}>
        <Typography variant='h5' sx={{ mb: 2, mt: 2 }}>
          Şube Bazlı Çalışan Sayıları
        </Typography>
      </Grid>

      {branchStats.length > 0 ? (
        branchStats.map((branch: any, index: number) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant='h6' color='text.primary'>
                      {branch.name}
                    </Typography>
                    <Typography variant='h4' sx={{ mb: 1 }}>
                      {branch.count}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {workers.active > 0 ? `%${((branch.count / workers.active) * 100).toFixed(1)}` : '0%'} oran
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'success.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className='tabler-building-store' style={{ fontSize: 24, color: 'white' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='body2' color='text.secondary'>
                Henüz şube verisi bulunmuyor
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Son Eklenen Çalışanlar - 4'lü Grid */}
      <Grid item xs={12}>
        <Typography variant='h5' sx={{ mb: 2, mt: 2 }}>
          Son Eklenen Çalışanlar (30 Gün)
        </Typography>
      </Grid>

      {recentHires.length > 0 ? (
        recentHires.map((worker: any, index: number) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ backgroundColor: 'info.main', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className='tabler-user-plus' style={{ fontSize: 24, color: 'white' }} />
                    </Box>
                  </Box>
                  <Typography variant='h6' color='text.primary' sx={{ mt: 1 }}>
                    {worker.firstName} {worker.lastName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {worker.department?.name || 'Departman yok'}
                  </Typography>
                  <Typography variant='caption' color='primary.main' sx={{ mt: 1 }}>
                    {new Date(worker.hireDate).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='body2' color='text.secondary'>
                Son 30 günde yeni işe alım yok
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default StatisticsPage
