'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Tag {
  id: number
  name: string
  slug: string
  _count: {
    posts: number
  }
}

export default function TagsManagePage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      setLoading(true)
      const response = await fetch('/api/tags')
      const data = await response.json()
      
      if (data.code === '0') {
        setTags(data.result)
      }
    } catch (error) {
      toast.error('获取标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingTag(null)
    setFormData({ name: '', slug: '' })
    setDialogOpen(true)
  }

  function openEditDialog(tag: Tag) {
    setEditingTag(tag)
    setFormData({ name: tag.name, slug: tag.slug })
    setDialogOpen(true)
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({ 
      ...prev, 
      name,
      slug: prev.slug || generateSlug(name)
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('请填写标签名称和链接')
      return
    }

    setSubmitting(true)

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags'
      const method = editingTag ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success(editingTag ? '标签更新成功' : '标签创建成功')
        setDialogOpen(false)
        fetchTags()
      } else {
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteTag(tag: Tag) {
    if (tag._count.posts > 0) {
      toast.error('无法删除正在使用的标签')
      return
    }

    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('标签删除成功')
        fetchTags()
      } else {
        toast.error(data.message || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest mb-2">— Tags —</p>
          <h1 className="text-3xl font-medium tracking-wide text-foreground">标 签 管 理</h1>
          <p className="text-muted-foreground mt-2">管理您的博客标签</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              新建标签
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingTag ? '编辑标签' : '新建标签'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingTag ? '修改标签信息' : '创建一个新的标签分类'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">标签名称</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="请输入标签名称"
                  className="bg-card border-border focus:border-primary"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-foreground">标签链接</Label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="请输入标签链接"
                  className="bg-card border-border focus:border-primary"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  用于URL中的标签标识，只能包含字母、数字和短横线
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-foreground hover:border-primary hover:text-primary hover:bg-transparent">
                  取消
                </Button>
                <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : tags.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="neo-card group border-border bg-card relative overflow-hidden
              transition-all duration-300 ease-in-out hover:shadow-lg">
              {/* 日间模式：左侧装饰线 */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:hidden" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-1 text-foreground">{tag.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      链接: /{tag.slug}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="neo-tag bg-accent-soft text-primary transition-all">
                        {tag._count?.posts} 篇文章
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(tag)}
                      className="hover:text-primary hover:bg-accent-soft"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTag(tag)}
                      disabled={tag?._count?.posts > 0}
                      className={tag?._count?.posts > 0 ? 'opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive hover:bg-destructive/10'}
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
            <p className="text-muted-foreground mb-4">还没有标签</p>
            <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              创建第一个标签
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 