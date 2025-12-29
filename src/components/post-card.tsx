'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PostCardProps {
  post: {
    id: number
    slug: string
    title: string
    summary: string | null
    publishAt: string | null
    tags: Array<{
      id: number
      name: string
      slug: string
    }>
    coverUrl: string | null
  }
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.slug}`} className="block h-full group">
      <Card className="neo-card h-full bg-card cursor-pointer relative overflow-hidden
        border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
        {/* 日间模式：左侧装饰线 */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:hidden" />

        <CardHeader className="pb-2 pt-4 px-4">
          <div className="space-y-2">
            {/* 日期 */}
            {post.publishAt && (
              <CardDescription className="text-xs text-muted-foreground tracking-wide">
                {new Date(post.publishAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            )}

            {/* 标题 */}
            <CardTitle className="line-clamp-2 text-base leading-relaxed tracking-wide">
              <span className="text-foreground group-hover:text-primary transition-colors">
                {post.title}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-3">
            {/* 摘要 */}
            {post.summary && (
              <p
                className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.summary }}
              />
            )}

            {/* 标签 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {post.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/posts?tag=${tag.slug}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="outline"
                      className="neo-tag text-xs py-0.5 px-2 border-border text-muted-foreground hover:bg-accent-soft hover:text-primary transition-all"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="outline" className="neo-tag text-xs py-0.5 px-2 border-border text-muted-foreground transition-all">
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* 阅读更多 */}
            <div className="pt-1">
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                阅读全文 →
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
