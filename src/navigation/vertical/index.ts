'use client'

import { authService } from '@/services/auth.service'

interface MenuItem {
  title: string
  icon: string
  path: string
  children?: MenuItem[]
  visible?: () => boolean
}

const getNavigation = (): MenuItem[] => [
  // Şirket Ana Sayfa (Statistics) - Tüm şirketler için
  {
    title: 'Ana Sayfa',
    icon: 'tabler-home',
    path: '/statistics',
    visible: () => !authService.isWorker() && (authService.isCompany() || authService.isAhiIk())
  },
  
  // Çalışan (Worker) Menüsü - Temel menüler (her worker için)
  {
    title: 'Ana Sayfa',
    icon: 'tabler-home',
    path: '/worker-dashboard',
    visible: () => authService.isWorker()
  },
  {
    title: 'QR Giriş/Çıkış',
    icon: 'tabler-scan',
    path: '/worker-pdks-scan',
    visible: () => authService.isWorker()
  },
  {
    title: 'İzin Taleplerim',
    icon: 'tabler-calendar',
    path: '/worker-leave-requests',
    visible: () => authService.isWorker()
  },
  {
    title: 'Görevlerim',
    icon: 'tabler-clipboard-list',
    path: '/worker-tasks',
    visible: () => authService.isWorker()
  },

  // Worker - İnsan Kaynakları Modülü (Ek yetkiler)
  {
    title: 'İnsan Kaynakları',
    icon: 'tabler-users',
    path: '/digital-hr',
    visible: () => authService.workerHasHumanResources(),
    children: [
      {
        title: 'Çalışanlar',
        icon: 'tabler-users',
        path: '/workers/list',
        visible: () => authService.workerHasHumanResources()
      },
      {
        title: 'QR Giriş-Çıkış',
        icon: 'tabler-clock',
        path: '/pdks',
        visible: () => authService.workerHasHumanResources()
      },
      {
        title: 'İzin Takip',
        icon: 'tabler-calendar',
        path: '/leave-tracking',
        visible: () => authService.workerHasHumanResources()
      },
      {
        title: 'Görev Yönetimi',
        icon: 'tabler-clipboard-list',
        path: '/tasks',
        visible: () => authService.workerHasHumanResources()
      },
      {
        title: 'Şubeler',
        icon: 'tabler-building-store',
        path: '/branches',
        visible: () => authService.workerHasHumanResources()
      },
      {
        title: 'Departmanlar',
        icon: 'tabler-briefcase',
        path: '/departments',
        visible: () => authService.workerHasHumanResources()
      }
    ]
  },

  // Worker - QR Giriş-Çıkış Modülü (Ek yetkiler)
  {
    title: 'QR Giriş-Çıkış',
    icon: 'tabler-clock',
    path: '/pdks',
    visible: () => authService.workerHasPdks() && !authService.workerHasHumanResources()
  },

  // Worker - Kurum Yönetimi Modülü
  {
    title: 'Kurum Yönetimi',
    icon: 'tabler-building-community',
    path: '/institution-management',
    visible: () => authService.workerHasInstitutionManagement(),
    children: [
      {
        title: 'Kurumlar',
        icon: 'tabler-building',
        path: '/institution-management/institutions',
        visible: () => authService.workerHasInstitutionManagement()
      },
      {
        title: 'Konutlar',
        icon: 'tabler-home',
        path: '/institution-management/properties',
        visible: () => authService.workerHasInstitutionManagement()
      },
      {
        title: 'Araçlar',
        icon: 'tabler-car',
        path: '/institution-management/vehicles',
        visible: () => authService.workerHasInstitutionManagement()
      },
      {
        title: 'Kararlar',
        icon: 'tabler-clipboard-text',
        path: '/institution-management/decisions',
        visible: () => authService.workerHasInstitutionManagement()
      },
      {
        title: 'Giden Evraklar',
        icon: 'tabler-file-export',
        path: '/institution-management/outgoing-documents',
        visible: () => authService.workerHasInstitutionManagement()
      },
      {
        title: 'Gelen Evraklar',
        icon: 'tabler-file-import',
        path: '/institution-management/incoming-documents',
        visible: () => authService.workerHasInstitutionManagement()
      }
    ]
  },

  // Worker - Satın Alma Modülü
  {
    title: 'Satın Alma',
    icon: 'tabler-shopping-cart',
    path: '/institution-management/purchasings',
    visible: () => authService.workerHasPurchasing() && !authService.workerHasInstitutionManagement()
  },
  
  {
    title: 'İnsan Kaynakları',
    icon: 'tabler-users',
    path: '/digital-hr',
    visible: () => !authService.isWorker() && (authService.isAhiIk() || authService.isEmployee()),
    children: [
      {
        title: 'Dijital İK',
        icon: 'tabler-file-check',
        path: '/digital-hr',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'Çalışanlarım',
        icon: 'tabler-users',
        path: '/workers/list',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'İşten Ayrılanlar',
        icon: 'tabler-user-off',
        path: '/workers/terminated',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'QR Giriş-Çıkış',
        icon: 'tabler-clock',
        path: '/pdks',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'İzin Takip Sistemi',
        icon: 'tabler-calendar',
        path: '/leave-tracking',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'Görev Yönetimi',
        icon: 'tabler-clipboard-list',
        path: '/tasks',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'Şubelerim',
        icon: 'tabler-building-store',
        path: '/branches',
        visible: () => authService.isAhiIk()
      },
      {
        title: 'Departmanlarım',
        icon: 'tabler-briefcase',
        path: '/departments',
        visible: () => authService.isAhiIk()
      }
    ]
  },
  {
    title: 'Kurum Yönetimi',
    icon: 'tabler-building-community',
    path: '/institution-management',
    visible: () => !authService.isWorker() && authService.isInstitutionManagement(),
    children: [
      {
        title: 'Kurumlarım',
        icon: 'tabler-building',
        path: '/institution-management/institutions',
        visible: () => authService.isInstitutionManagement()
      },
      {
        title: 'Konutlarım',
        icon: 'tabler-home',
        path: '/institution-management/properties',
        visible: () => authService.isInstitutionManagement()
      },
      {
        title: 'Araçlarım',
        icon: 'tabler-car',
        path: '/institution-management/vehicles',
        visible: () => authService.isInstitutionManagement()
      },
      {
        title: 'Kararlar',
        icon: 'tabler-clipboard-text',
        path: '/institution-management/decisions',
        visible: () => authService.isInstitutionManagement()
      },
      {
        title: 'Giden Evraklar',
        icon: 'tabler-file-export',
        path: '/institution-management/outgoing-documents',
        visible: () => authService.isInstitutionManagement()
      },
      {
        title: 'Gelen Evraklar',
        icon: 'tabler-file-import',
        path: '/institution-management/incoming-documents',
        visible: () => authService.isInstitutionManagement()
      },
      {
        title: 'Satın Alma',
        icon: 'tabler-shopping-cart',
        path: '/institution-management/purchasings',
        visible: () => authService.isInstitutionManagement()
      }
    ]
  },
  {
    title: 'Anımsatıcılar',
    icon: 'tabler-bell',
    path: '/institution-management/reminders',
    visible: () => !authService.isWorker() && authService.isInstitutionManagement()
  },
  {
    title: 'Kullanıcı Yönetim',
    icon: 'tabler-users',
    path: '/users',
    visible: () => !authService.isWorker() && authService.isEmployee(),
    children: [
      {
        title: 'Kullanıcılar',
        icon: 'tabler-list',
        path: '/users/list'
      },
      {
        title: 'Yeni Kullanıcı',
        icon: 'tabler-plus',
        path: '/users/create'
      }
    ]
  },
  {
    title: 'Demo Taleplerim',
    icon: 'tabler-phone-call',
    path: '/demo-requests',
    visible: () => !authService.isWorker() && authService.isEmployee()
  },
  {
    title: 'Ayarlar',
    icon: 'tabler-settings',
    path: '/company-settings',
    visible: () => authService.isCompany() && !authService.isWorker()
  }
]

export default getNavigation
