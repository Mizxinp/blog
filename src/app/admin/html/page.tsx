'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface HtmlPreview {
  id: number
  slug: string
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  updatedAt: string
  publishAt: string | null
}

export default function HtmlManagementPage() {
  const [items, setItems] = useState<HtmlPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const response = await fetch('/api/html?status=ALL')
      const data = await response.json()

      if (data.code === '0') {
        setItems(data.result.items)
      }
    } catch (error) {
      toast.error('获取列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function createNew() {
    try {
      const response = await fetch('/api/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: '未命名预览' }),
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('创建成功')
        window.location.href = `/admin/html/${data.result.id}`
      } else {
        toast.error(data.message || '创建失败')
      }
    } catch (error) {
      toast.error('创建失败')
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('确定要删除吗？此操作不可恢复。')) {
      return
    }

    try {
      const response = await fetch(`/api/html/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('删除成功')
        fetchItems()
      } else {
        toast.error(data.message || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">已发布</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">草稿</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest mb-2">— HTML Preview —</p>
          <h1 className="text-3xl font-medium tracking-wide text-foreground">HTML 预 览 管 理</h1>
          <p className="text-muted-foreground mt-2">管理您的 HTML 预览页面</p>
        </div>
        <Button onClick={createNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          新建预览
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardHeader>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="neo-card group border-border bg-card relative overflow-hidden
              transition-all duration-300 ease-in-out hover:shadow-lg">
              {/* 日间模式：左侧装饰线 */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:hidden" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-1 text-foreground">{item.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      /{item.slug}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {getStatusBadge(item.status)}
                      <span>
                        更新于 {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                      {item.publishAt && (
                        <span>
                          发布于 {new Date(item.publishAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'PUBLISHED' && (
                      <Button variant="ghost" size="sm" asChild className="hover:text-primary hover:bg-accent-soft">
                        <Link href={`/html/${item.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild className="hover:text-primary hover:bg-accent-soft">
                      <Link href={`/admin/html/${item.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground mb-4">还没有 HTML 预览</p>
            <Button onClick={createNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              创建第一个预览
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
