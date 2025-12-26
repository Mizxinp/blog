'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: number; email: string; name: string | null; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()

    // 监听认证状态变化事件
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
      // 触发认证状态更新事件
      window.dispatchEvent(new CustomEvent('auth-changed'))
      window.location.href = '/'
    } catch (error) {
      console.error('登出失败')
    }
  }

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/posts', label: '文章' },
    // { href: '/about', label: '关于' }
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Logo />
            </Link>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary py-1",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 右侧菜单 */}
          <div className="flex items-center space-x-2">
            {/* 主题切换 */}
            <ThemeToggle />

            {/* 桌面端用户菜单 */}
            <div className="hidden md:flex items-center space-x-2">
              {!loading && (
                user ? (
                  <>
                    <Button variant="outline" size="sm" asChild className="border-border text-foreground hover:border-primary hover:text-primary hover:bg-transparent">
                      <Link href="/admin">管理后台</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                      登出
                    </Button>
                  </>
                ) : (
                  <Button variant="default" size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/login">登录</Link>
                  </Button>
                )
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block text-sm font-medium transition-colors hover:text-primary px-2 py-2 rounded",
                    pathname === item.href
                      ? "text-primary bg-accent-soft/50"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* 移动端用户菜单 */}
              <div className="pt-3 border-t border-border space-y-2">
                {!loading && (
                  user ? (
                    <>
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full border-border">
                          管理后台
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                      >
                        登出
                      </Button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" size="sm" className="w-full bg-primary text-primary-foreground">
                        登录
                      </Button>
                    </Link>
                  )
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
