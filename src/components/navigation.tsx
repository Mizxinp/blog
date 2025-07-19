'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: number; email: string; name: string | null; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.code === '0') {
          setUser(data.result.user)
        }
      }
    } catch (error) {
      // 未登录
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('登出失败')
    }
  }

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/posts', label: '文章' },
    { href: '/about', label: '关于' }
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              技术博客
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* 移动端菜单 */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <span className="font-bold">技术博客</span>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-2">
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin">管理</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    登出
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">登录</Link>
                </Button>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  )
} 