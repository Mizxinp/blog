'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('请填写邮箱和密码')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('登录成功')
        // 触发导航栏状态更新
        window.dispatchEvent(new CustomEvent('auth-changed'))
        router.push(redirect || '/admin')
      } else {
        toast.error(data.message || '登录失败')
      }
    } catch (error) {
      toast.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-border bg-card">
      <CardHeader className="text-center">
        <p className="text-xs text-muted-foreground tracking-widest mb-2">— Admin —</p>
        <CardTitle className="text-2xl font-medium tracking-wide text-foreground">管 理 登 录</CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          请输入您的邮箱和密码来访问管理后台
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="h-10 bg-card border-border focus:border-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="h-10 bg-card border-border focus:border-primary"
              required
            />
          </div>
          <Button type="submit" className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <Card className="shadow-lg border-border bg-card">
            <CardHeader className="text-center">
              <div className="text-muted-foreground">加载中...</div>
            </CardHeader>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
