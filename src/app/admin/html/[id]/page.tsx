'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface HtmlPreview {
  id: number
  slug: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED'
  publishAt: string | null
}

export default function HtmlEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [data, setData] = useState<HtmlPreview | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')

  // 获取详情
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/html/${id}`)
      const result = await res.json()
      if (result.code === '0') {
        setData(result.result)
        setTitle(result.result.title)
        setSlug(result.result.slug)
        setContent(result.result.content)
      } else {
        toast.error('获取数据失败')
        router.push('/admin/html')
      }
    } catch (error) {
      toast.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入标题')
      return
    }
    if (!slug.trim()) {
      toast.error('请输入 Slug')
      return
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast.error('Slug 只能包含小写字母、数字和连字符')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/html/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content })
      })
      const result = await res.json()
      if (result.code === '0') {
        setData(result.result)
        toast.success('保存成功')
      } else {
        toast.error(result.message || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 发布
  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error('请先输入 HTML 内容')
      return
    }

    // 先保存
    if (!title.trim() || !slug.trim()) {
      toast.error('请先填写标题和 Slug')
      return
    }

    setPublishing(true)
    try {
      // 先保存
      const saveRes = await fetch(`/api/html/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content })
      })
      const saveResult = await saveRes.json()
      if (saveResult.code !== '0') {
        toast.error(saveResult.message || '保存失败')
        setPublishing(false)
        return
      }

      // 再发布
      const res = await fetch(`/api/html/${id}/publish`, {
        method: 'POST'
      })
      const result = await res.json()
      if (result.code === '0') {
        setData(result.result)
        toast.success('发布成功')
      } else {
        toast.error(result.message || '发布失败')
      }
    } catch (error) {
      toast.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/html')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Badge variant={data?.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {data?.status === 'PUBLISHED' ? '已发布' : '草稿'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!content.trim()}>
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
            {data?.status !== 'PUBLISHED' && (
              <Button onClick={handlePublish} disabled={publishing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="w-4 h-4 mr-2" />
                {publishing ? '发布中...' : '发布'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="container py-6 max-w-4xl">
        <div className="space-y-6">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入标题"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              访问链接
              <span className="text-muted-foreground ml-2 font-normal text-sm">
                /html/{slug || 'your-slug'}
              </span>
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="请输入 slug（小写字母、数字、连字符）"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          {/* HTML 内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">HTML 内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请粘贴完整的 HTML 内容..."
              className="min-h-[500px] font-mono text-sm bg-card border-border focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 预览 Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle>预览 - {title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto h-[70vh]">
            <iframe
              srcDoc={content}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
