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
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">文章列表</h1>
        
        {/* 搜索框 */}
        <div className="mb-6">
          <Input
            placeholder="搜索文章..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* 标签筛选 */}
        {tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={currentTag === tag.slug ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleTagClick(tag.slug)}
                >
                  {tag.name} ({tag.postCount})
                </Badge>
              ))}
            </div>
            
            {(searchQuery || currentTag) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
              >
                清除筛选
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {searchQuery || currentTag ? '没有找到匹配的文章' : '还没有文章'}
          </p>
          {(searchQuery || currentTag) && (
            <Button variant="outline" onClick={clearFilters}>
              查看所有文章
            </Button>
          )}
        </div>
      )}
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