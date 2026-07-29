import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Giriş gerektirmeyen sayfalar
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/public',
  '/_next',
  '/static',
  '/images',
  '/favicon.ico'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('token')?.value
  const user = request.cookies.get('user')?.value
  const userData = user ? JSON.parse(user) : null

  // Public sayfalara erişim kontrolü
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Eğer root ise rol bazlı yönlendir
  if (pathname === '/home' || pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Role göre yönlendirme
    const dest = userData?.role?.type === 'employee'
      ? '/employee-dashboard'
      : userData?.role?.type === 'authenticated'
        ? '/statistics'
        : userData?.role?.type === 'worker'
          ? '/worker-dashboard'
          : userData?.role?.type === 'is-guvenligi'
            ? '/is-guvenligi/dashboard'
            : '/login'

    return NextResponse.redirect(new URL(dest, request.url))
  }
  
  // WORKER KORUMASI: Worker sadece kendi sayfalarına + yetkili olduğu modüllere erişebilir
  if (userData?.role?.type === 'worker') {
    const workerAllowedPaths = [
      '/worker-dashboard',
      '/worker-tasks',
      '/worker-leave-requests',
      '/worker-pdks-scan',
      '/worker-payslips', // Kendi ücret pusulaları
      '/profile/password' // Şifre değiştirme sayfası
    ]

    // Çalışana verilen modül yetkileri (auth.service login/checkAuth sırasında yazar)
    const modulesCookie = request.cookies.get('workerModules')?.value
    let workerModules: Record<string, boolean> = {}

    try {
      workerModules = modulesCookie ? JSON.parse(modulesCookie) : {}
    } catch {
      workerModules = {}
    }

    const hasModule = (name: string) => workerModules.all === true || workerModules[name] === true

    if (hasModule('hr')) {
      workerAllowedPaths.push(
        '/workers',
        '/pdks',
        '/leave-tracking',
        '/tasks',
        '/branches',
        '/departments',
        '/ucret-pusulasi'
      )
    }

    if (hasModule('pdks')) {
      workerAllowedPaths.push('/pdks')
    }

    if (hasModule('institution')) {
      workerAllowedPaths.push('/institution-management')
    }

    if (hasModule('purchasing')) {
      workerAllowedPaths.push('/institution-management/purchasings')
    }

    const isWorkerPath = workerAllowedPaths.some(path => pathname.startsWith(path))

    // Worker izinli path'de değilse, dashboard'a yönlendir
    if (!isWorkerPath) {
      console.log('Worker unauthorized path attempt:', pathname, '- Redirecting to dashboard')
      return NextResponse.redirect(new URL('/worker-dashboard', request.url))
    }
  }

  // İŞ GÜVENLİĞİ KORUMASI: İş Güvenliği rolü sadece kendi sayfalarına erişebilir
  if (userData?.role?.type === 'is-guvenligi') {
    const isGuvenligiAllowedPaths = [
      '/is-guvenligi',
      '/profile/password' // Şifre değiştirme sayfası
    ]

    // Tam segment eşleşmesi: düz startsWith, admin'e ait /is-guvenligi-firmalari
    // sayfasını da "izinli" sayıyordu (aynı önekle başlıyor).
    const isIsGuvenligiPath = isGuvenligiAllowedPaths.some(
      path => pathname === path || pathname.startsWith(`${path}/`)
    )

    // İş Güvenliği izinli path'de değilse, dashboard'a yönlendir
    if (!isIsGuvenligiPath) {
      console.log('İş Güvenliği unauthorized path attempt:', pathname, '- Redirecting to dashboard')
      return NextResponse.redirect(new URL('/is-guvenligi/dashboard', request.url))
    }
  }

  // Token yoksa login sayfasına yönlendir
  if (!token) {
    const loginUrl = new URL('/login', request.url)

    loginUrl.searchParams.set('from', pathname)

    return NextResponse.redirect(loginUrl)
  }

  // ŞIRKET/ADMIN SAYFALARI KORUMASI: Worker bu sayfalara erişemez
  const companyPaths = [
    '/digital-hr',
    '/workers',
    '/pdks',
    '/leave-tracking',
    '/tasks',
    '/ucret-pusulasi',
    '/branches',
    '/departments',
    '/statistics',
    '/services',
    '/pages',
    '/datas',
    '/users',
    '/demo-requests',
    '/applications',
    '/jobs',
    '/company-dashboard',
    '/employee-dashboard',
    '/statistics',
    '/profile/company'
  ]
  
  const isCompanyPath = companyPaths.some(path => pathname.startsWith(path))
  
  if (isCompanyPath && userData) {
    const isWorker = userData?.role?.type === 'worker'

    // Worker buraya ancak yukarıdaki modül yetkisi kontrolünden geçerek gelir;
    // geçtiyse yetkili demektir, engelleme.
    if (isWorker) {
      return NextResponse.next()
    }

    // AHİ-İK kontrolü (sadece şirketler için)
    // NOT: /branches ve /departments listede yok — organizasyon yapısı (şube/departman)
    // İK aboneliği olmayan şirketler için de açıktır.
    const ahiIkPaths = ['/digital-hr', '/workers', '/pdks', '/leave-tracking', '/tasks', '/ucret-pusulasi']
    const isAhiIkPath = ahiIkPaths.some(path => pathname.startsWith(path))
    
    if (isAhiIkPath) {
      const isCompany = userData?.role?.type === 'authenticated'
      const isEmployee = userData?.role?.type === 'employee'
      const isAhiIk = isCompany && userData?.ahiIkMember === true

      // Şirketler sadece AHİ-İK'ya tanımlı ise erişebilir
      // Employee her zaman erişebilir
      if (isCompany && !isAhiIk) {
        return NextResponse.redirect(new URL('/company-dashboard', request.url))
      }
      
      // Employee değilse ve AHİ-İK şirket değilse erişemez
      if (!isEmployee && !isAhiIk) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return NextResponse.next()
}

// Middleware'in çalışacağı path'leri belirt
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|favicon.ico|public).*)',
  ],
}
