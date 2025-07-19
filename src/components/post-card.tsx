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
    <Card className="h-full">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="line-clamp-2">
            <Link 
              href={`/posts/${post.slug}`}
              className="hover:text-primary transition-colors"
            >
              {post.title}
            </Link>
          </CardTitle>
          {post.publishAt && (
            <CardDescription>
              {new Date(post.publishAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.summary}
            </p>
          )}
          
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                  <Badge variant="secondary" className="hover:bg-primary/10 transition-colors">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 