import Link from 'next/link'
import { Button } from '@/components/ui/button'

// 禁用页面缓存，确保每次请求都获取最新数据
export const dynamic = 'force-dynamic'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/post-card'
import { ContributionHeatmap } from '@/components/contribution-heatmap'
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
        posts: {
          where: {
            post: {
              status: 'PUBLISHED',
              deletedAt: null
            }
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
      postCount: tag.posts.length
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
    <div className="py-8">
      {/* Hero 区域 */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          {/* 装饰性引言 */}
          <p className="text-sm text-muted-foreground tracking-widest mb-6">
            — 笔墨之间，皆是生活 —
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-tight tracking-wide text-foreground">
            墨舟的博客
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            记录技术探索的点滴，分享对编程与生活的思考
          </p>

          {/* 装饰分隔线 */}
          {/* <div className="w-12 h-0.5 bg-primary mx-auto" /> */}
        </div>
      </section>

      {/* 创作指数模块 */}
      <section className="py-12 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <ContributionHeatmap showSummary={false} />
        </div>
      </section>

      {/* 最新文章 */}
      <section id="recent-posts" className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-2 text-foreground">近 期 文 章</h2>
            </div>

            {/* 热门标签 - 放在文章区域右上角 */}
            {tags.length > 0 && (
              <div className="hidden lg:block">
                <p className="text-sm text-muted-foreground mb-3">热门话题</p>
                <div className="flex flex-wrap gap-2 max-w-xs">
                  {tags.map((tag) => (
                    <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                      <Badge
                        variant="outline"
                        className="text-xs py-1 px-3 hover:bg-accent-soft hover:text-primary hover:border-primary transition-colors border-border"
                      >
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {postsData.items.length > 0 ? (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {postsData.items.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Button variant="outline" asChild size="lg" className="border-border hover:border-primary hover:text-primary">
                  <Link href="/posts">查看全部文章 →</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-card border border-border rounded">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2 text-foreground">即将发布</h3>
                <p className="text-muted-foreground mb-6">
                  正在准备精彩的技术内容，敬请期待
                </p>
              </div>
            </div>
          )}

          {/* 移动端标签 - 放在文章列表下方但样式更低调 */}
          {tags.length > 0 && (
            <div className="lg:hidden mt-12 pt-8 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">浏览更多话题</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {tags.slice(0, 8).map((tag) => (
                    <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                      <Badge
                        variant="outline"
                        className="text-xs py-1 px-3 hover:bg-accent-soft hover:text-primary hover:border-primary transition-colors border-border"
                      >
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/posts" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    查看全部标签 →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// 添加一些样式
export const metadata = {
  title: '墨舟的博客',
  description: '记录技术探索的点滴，分享对编程与生活的思考'
}
