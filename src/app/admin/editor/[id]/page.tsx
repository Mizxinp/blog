'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Send, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Post {
  id: number
  slug: string
  title: string
  summary: string | null
  contentMd: string
  status: string
  publishAt: string | null
  updatedAt: string
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [postId, setPostId] = useState<string>('')

  useEffect(() => {
    params.then(resolvedParams => {
      setPostId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  // 自动保存
  useEffect(() => {
    if (!post) return
    
    const timer = setTimeout(() => {
      if (title !== post.title || content !== post.contentMd || summary !== (post.summary || '')) {
        handleSave(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [title, content, summary, post])

  async function fetchPost() {
    try {
      const response = await fetch(`/api/posts/detail?id=${postId}`)
      const data = await response.json()
      
      if (data.code === '0') {
        const postData = data.result
        setPost(postData)
        setTitle(postData.title)
        setContent(postData.contentMd)
        setSummary(postData.summary || '')
      } else {
        toast.error('文章不存在')
        router.push('/admin')
      }
    } catch (error) {
      toast.error('获取文章失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(showToast = true) {
    if (!post) return

    try {
      setSaving(true)
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          contentMd: content,
          summary: summary || null
        }),
      })

      const data = await response.json()

      if (data.code === '0') {
        if (showToast) {
          toast.success('保存成功')
        }
        // 更新本地状态
        setPost(prev => prev ? { ...prev, title, contentMd: content, summary } : null)
      } else {
        toast.error(data.message || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!post) return
    
    if (!title.trim()) {
      toast.error('请输入文章标题')
      return
    }
    
    if (!content.trim()) {
      toast.error('请输入文章内容')
      return
    }

    try {
      setPublishing(true)
      
      // 先保存
      await handleSave(false)
      
      // 再发布
      const response = await fetch(`/api/posts/${post.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publishAt: null }),
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('发布成功')
        setPost(prev => prev ? { ...prev, status: 'PUBLISHED', publishAt: data.result.publishAt } : null)
      } else {
        toast.error(data.message || '发布失败')
      }
    } catch (error) {
      toast.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container py-8">
        <p>文章不存在</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="border-b px-6 py-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回管理
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
              </Badge>
              {saving && <span className="text-sm text-muted-foreground">保存中...</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.status === 'PUBLISHED' && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/posts/${post.slug}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  预览
                </Link>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
            
            <Button 
              size="sm" 
              onClick={handlePublish}
              disabled={publishing || saving}
            >
              <Send className="mr-2 h-4 w-4" />
              {post.status === 'PUBLISHED' ? '更新' : '发布'}
            </Button>
          </div>
        </div>
      </div>

      {/* 主编辑区域 - 左右分屏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧编辑器 */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-6 flex-1 overflow-auto">
            <div className="space-y-6">
              {/* 标题 */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="文章标题..."
                  className="text-2xl md:text-3xl font-bold border-none p-0 h-auto focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                  style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}
                />
              </div>

              <Separator />

              {/* 摘要 */}
              <div className="space-y-2">
                <Label htmlFor="summary" className="text-sm font-medium">摘要（可选）</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="为文章添加一段简短的摘要..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* 内容编辑器 */}
              <div className="space-y-2 flex-1">
                <Label htmlFor="content" className="text-sm font-medium">内容</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="开始写作... 支持 Markdown 语法"
                  className="min-h-[400px] font-mono text-sm leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧预览 */}
        <div className="w-1/2 flex flex-col bg-muted/30">
          <div className="p-4 border-b bg-background">
            <h3 className="font-medium text-sm text-muted-foreground">实时预览</h3>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {title || content || summary ? (
              <div className="bg-background rounded-lg p-6 shadow-sm">
                {/* 预览标题 */}
                {title && (
                  <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                    {title}
                  </h1>
                )}
                
                {/* 预览摘要 */}
                {summary && (
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {summary}
                  </p>
                )}
                
                {summary && content && <Separator className="mb-6" />}
                
                {/* 预览内容 */}
                {content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {content}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-muted-foreground mb-2">开始编写文章</p>
                  <p className="text-sm text-muted-foreground">
                    在左侧输入标题和内容，这里会显示实时预览
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 