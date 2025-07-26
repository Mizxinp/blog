'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Post {
  id: number
  slug: string
  title: string
  summary: string | null
  status: string
  publishAt: string | null
  updatedAt: string
}

export default function PostsManagePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  console.log('posts', posts)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      const response = await fetch('/api/posts?status=ALL')
      const data = await response.json()
      
      if (data.code === '0') {
        setPosts(data.result.items)
      }
    } catch (error) {
      toast.error('获取文章列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function createNewPost() {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: '未命名文章' }),
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('文章创建成功')
        // 跳转到编辑页面
        window.location.href = `/admin/editor/${data.result.id}`
      } else {
        toast.error(data.message || '创建失败')
      }
    } catch (error) {
      toast.error('创建文章失败')
    }
  }

  async function deletePost(postId: number) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.code === '0') {
        toast.success('文章删除成功')
        fetchPosts() // 重新获取文章列表
      } else {
        toast.error(data.message || '删除失败')
      }
    } catch (error) {
      toast.error('删除文章失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">已发布</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">草稿</Badge>
      case 'DELETED_SOFT':
        return <Badge variant="destructive">已删除</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">文章管理</h1>
          <p className="text-muted-foreground">管理您的博客文章</p>
        </div>
        <Button onClick={createNewPost}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新建文章
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-1">{post.title}</CardTitle>
                    <CardDescription>
                      <div dangerouslySetInnerHTML={{ __html: post.summary || '暂无摘要' }}/>
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {getStatusBadge(post.status)}
                      <span>
                        更新于 {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                      {post.publishAt && (
                        <span>
                          发布于 {new Date(post.publishAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === 'PUBLISHED' && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/posts/${post.slug}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/editor/${post.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deletePost(post.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground mb-4">还没有文章</p>
            <Button onClick={createNewPost}>
              <PlusCircle className="mr-2 h-4 w-4" />
              创建第一篇文章
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 