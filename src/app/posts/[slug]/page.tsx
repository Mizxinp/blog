import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Post {
  id: number
  slug: string
  title: string
  summary: string | null
  contentHtml: string | null
  contentMd: string
  status: string
  publishAt: string | null
  updatedAt: string
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  coverUrl: string | null
  author: {
    id: number
    name: string | null
    email: string
  }
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts/detail?slug=${slug}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.code === '0' ? data.result : null
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const post = await getPost(resolvedParams.slug)
  
  if (!post) {
    return {
      title: '文章不存在'
    }
  }

  return {
    title: `${post.title} - 技术博客`,
    description: post.summary || '技术文章详情页',
  }
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const post = await getPost(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="container py-8">
      {/* 返回按钮 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回文章列表
          </Link>
        </Button>
      </div>

      {/* 文章头部 */}
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          
          {/* 文章元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            {post.publishAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              更新于 {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
            </div>
          </div>

          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                  <Badge variant="secondary" className="hover:bg-primary/10 transition-colors">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <Separator className="mb-8" />
        </header>

        {/* 文章内容 */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {post.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          ) : (
            <div className="whitespace-pre-wrap">{post.contentMd}</div>
          )}
        </div>

        {/* 文章底部 */}
        <footer className="mt-16 pt-8 border-t">
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">{post.author.name || '博客作者'}</p>
                <p className="text-sm text-muted-foreground">{post.author.email}</p>
              </div>
            </div> */}
            
            <Button variant="outline" asChild>
              <Link href="/posts">更多文章</Link>
            </Button>
          </div>
        </footer>
      </article>
    </div>
  )
} 