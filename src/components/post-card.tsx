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
    <Link href={`/posts/${post.slug}`} className="block h-full">
      <Card className="h-full hover:shadow-lg transition-all duration-300 group border-border/50 bg-card cursor-pointer">
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <CardTitle className="line-clamp-2 text-lg leading-tight">
              <span className="hover:text-primary transition-colors group-hover:text-primary">
                {post.title}
              </span>
            </CardTitle>
            {post.publishAt && (
              <CardDescription className="text-xs">
                {new Date(post.publishAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {post.summary && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.summary }} />
            )}
            
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                {post.tags.slice(0, 3).map((tag) => (
                  <Link 
                    key={tag.id} 
                    href={`/posts?tag=${tag.slug}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge 
                      variant="secondary" 
                      className="hover:bg-primary/10 transition-colors text-xs py-0.5 px-2"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs py-0.5 px-2">
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 