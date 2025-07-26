'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/post-card'
import { Skeleton } from '@/components/ui/skeleton'

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
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">全部文章</h1>
        </div>
        
        {/* 搜索框 */}
        <div className="flex justify-center mb-8">
          <Input
            placeholder="搜索文章标题、内容..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* 标签筛选 */}
        {tags.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">按标签筛选</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={currentTag === tag.slug ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-sm py-1 px-3"
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
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
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
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || currentTag ? '没有找到匹配的文章' : '还没有发布文章'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || currentTag 
                  ? '试试调整搜索条件或浏览其他内容' 
                  : '敬请期待更多精彩内容'}
              </p>
              {(searchQuery || currentTag) && (
                <Button variant="outline" onClick={clearFilters}>
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
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6">文章列表</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <PostsPageContent />
    </Suspense>
  )
} 