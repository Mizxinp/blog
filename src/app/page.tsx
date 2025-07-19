import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/post-card'
import { prisma } from '@/lib/prisma'

// 直接调用数据库获取数据
async function getRecentPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        publishAt: 'desc'
      },
      take: 5
    })

    const items = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      publishAt: post.publishAt ? post.publishAt.toISOString() : null,
      coverUrl: post.coverUrl,
      tags: post.tags.map(pt => pt.tag)
    }))

    return { items }
  } catch (error) {
    console.error('获取文章失败:', error)
    return { items: [] }
  }
}

async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag._count.posts
    }))
  } catch (error) {
    console.error('获取标签失败:', error)
    return []
  }
}

export default async function HomePage() {
  const [postsData, tags] = await Promise.all([
    getRecentPosts(),
    getTags()
  ])

  return (
    <div className="container py-8">
      {/* Hero 区域 */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
          技术博客
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          分享前端开发、全栈技术和编程实践经验，探索技术的无限可能
        </p>
        <Button asChild size="lg">
          <Link href="/posts">查看全部文章</Link>
        </Button>
      </section>

      {/* 最新文章 */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">最新文章</h2>
          <Button variant="outline" asChild>
            <Link href="/posts">查看更多</Link>
          </Button>
        </div>
        
        {postsData.items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {postsData.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">还没有文章</p>
          </div>
        )}
      </section>

      {/* 标签云 */}
      {tags.length > 0 && (
        <section className="py-16">
          <h2 className="text-3xl font-bold mb-8">热门标签</h2>
          <div className="flex flex-wrap gap-3">
            {tags.slice(0, 20).map((tag) => (
              <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                <Badge 
                  variant="outline" 
                  className="text-base py-2 px-4 hover:bg-primary/10 transition-colors"
                >
                  {tag.name} ({tag.postCount})
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// 添加一些样式
export const metadata = {
  title: '技术博客 - 分享技术心得与实践经验',
  description: '分享前端开发、全栈技术和编程实践经验，探索技术的无限可能'
}
