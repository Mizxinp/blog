'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'

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
      <Card className="h-full flex flex-col overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/40">

        {/* 图片区域 - 仅当有封面图时显示，且保持紧凑 */}
        {post.coverUrl && (
          <div className="relative w-full aspect-[2/1] overflow-hidden bg-muted/50 border-b border-border/50">
            <img
              src={post.coverUrl}
              alt={post.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <CardHeader className="p-4 pb-2 space-y-1">
          <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </CardTitle>

          {/* 标签放在标题下方或上方都可以，这里放在标题和正文之间，或者底部？用户要求紧凑且时间在下。通常标签和时间在一起比较好。 */}
        </CardHeader>

        {post.summary && (
          <CardContent className="p-4 pt-0 flex-1">
            <div
              className="text-sm text-muted-foreground leading-normal line-clamp-3 md:line-clamp-4"
              dangerouslySetInnerHTML={{ __html: post.summary }}
            />
          </CardContent>
        )}

        <CardFooter className="p-4 pt-2 mt-auto bg-muted/5 flex items-center justify-between">
          {/* <CardFooter className="p-4 pt-2 mt-auto border-t border-border/30 bg-muted/5 flex items-center justify-between"> */}
          {/* 左侧：时间 */}
          <div className="flex items-center text-xs text-muted-foreground/80">
            {post.publishAt && (
              <>
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                <time>
                  {new Date(post.publishAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </time>
              </>
            )}
          </div>

          {/* 右侧：标签（仅显示第一个，保持紧凑） */}
          {post.tags.length > 0 && (
            <div className="flex gap-1.5">
              {post.tags.slice(0, 2).map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 font-normal border-border/60 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors bg-background/50"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
