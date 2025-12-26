'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/post-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'

interface Post {
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

interface Tag {
  id: number
  name: string
  slug: string
  postCount: number
}

function PostsPageContent() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTag, setCurrentTag] = useState<string | null>(null)

  const page = parseInt(searchParams.get('page') || '1')
  const tagFilter = searchParams.get('tag')

  useEffect(() => {
    if (tagFilter) {
      setCurrentTag(tagFilter)
    }
  }, [tagFilter])

  useEffect(() => {
    fetchPosts()
    fetchTags()
  }, [searchQuery, currentTag, page])

  async function fetchPosts() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '12'
      })

      if (searchQuery) params.append('q', searchQuery)
      if (currentTag) params.append('tag', currentTag)

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (data.code === '0') {
        setPosts(data.result.items)
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTags() {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()

      if (data.code === '0') {
        setTags(data.result)
      }
    } catch (error) {
      console.error('获取标签列表失败:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleTagClick = (tagSlug: string) => {
    if (currentTag === tagSlug) {
      setCurrentTag(null)
    } else {
      setCurrentTag(tagSlug)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCurrentTag(null)
  }

  return (
    <div className="py-8">
      {/* 页面标题和搜索区域 */}
      <div className="mb-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-medium tracking-wide mb-2 text-foreground">全 部 文 章</h1>
        </div>

        {/* 搜索框 */}
        <div className="flex justify-center mb-8">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文章标题、内容..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
        </div>

        {/* 标签筛选 */}
        {tags.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={currentTag === tag.slug ? "default" : "outline"}
                  className={`cursor-pointer transition-colors text-sm py-1.5 px-4 ${
                    currentTag === tag.slug
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary hover:text-primary hover:bg-accent-soft'
                  }`}
                  onClick={() => handleTagClick(tag.slug)}
                >
                  {tag.name} ({tag.postCount})
                </Badge>
              ))}
            </div>

            {(searchQuery || currentTag) && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-border text-foreground hover:border-primary hover:text-primary hover:bg-transparent"
                >
                  清除筛选条件
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 文章列表 */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4 bg-card border border-border rounded p-6">
                <Skeleton className="h-4 w-1/3 bg-muted" />
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-border rounded">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2 text-foreground">
                {searchQuery || currentTag ? '没有找到匹配的文章' : '还没有发布文章'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || currentTag
                  ? '试试调整搜索条件或浏览其他内容'
                  : '敬请期待更多精彩内容'}
              </p>
              {(searchQuery || currentTag) && (
                <Button variant="outline" onClick={clearFilters} className="border-border text-foreground hover:border-primary hover:text-primary hover:bg-transparent">
                  查看所有文章
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PostsPage() {
  return (
    <Suspense fallback={
      <div className="py-8">
        <div className="text-center mb-10">
          <p className="text-sm text-muted-foreground tracking-widest mb-4">— Articles —</p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-wide mb-2 text-foreground">全 部 文 章</h1>
        </div>
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4 bg-card border border-border rounded p-6">
              <Skeleton className="h-4 w-1/3 bg-muted" />
              <Skeleton className="h-6 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    }>
      <PostsPageContent />
    </Suspense>
  )
}
