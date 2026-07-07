'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import { Card, CardContent, Grid, Typography } from '@mui/material'

// Hook Imports
import { formatNumber } from '@core/utils/format'

// Axios Import
import { axiosClient } from '@/libs/axios'

const EmployeeDashboardPage = () => {
  // States
  const [stats, setStats] = useState({
    totalUsers: 0
  })

  const [loading, setLoading] = useState(true)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user stats only
        const usersResponse = await axiosClient.get('/api/users', {
          params: {
            'pagination[pageSize]': 1 // Just need the count
          }
        })

        setStats({
          totalUsers: usersResponse.data.meta?.pagination?.total || 0
        })
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
      {/* İstatistik Kartları */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant='h6' color='text.primary'>
              Toplam Kullanıcı
            </Typography>
            <Typography variant='h4' sx={{ mb: 1 }}>
              {formatNumber(stats.totalUsers)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Sistemdeki tüm kullanıcılar
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default EmployeeDashboardPage
