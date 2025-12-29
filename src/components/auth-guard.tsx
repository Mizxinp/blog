'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()

    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('auth-changed', handleAuthChange)

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange)
    }
  }, [])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.code === '0') {
          setIsAuthenticated(true)
          return
        }
      }
      setIsAuthenticated(false)
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    } catch (error) {
      setIsAuthenticated(false)
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
