'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { X, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Tag {
  id: number
  name: string
  slug: string
}

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  className?: string
}

export function TagSelector({ selectedTags, onTagsChange, className }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      setLoading(true)
      const response = await fetch('/api/tags')
      const data = await response.json()
      
      if (data.code === '0') {
        setAvailableTags(data.result)
      }
    } catch (error) {
      toast.error('获取标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  function handleAddTag(tagId: string) {
    const tag = availableTags.find(t => t.id.toString() === tagId)
    if (tag && !selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag])
    }
  }

  function handleRemoveTag(tagId: number) {
    onTagsChange(selectedTags.filter(t => t.id !== tagId))
  }

  const unselectedTags = availableTags.filter(
    tag => !selectedTags.find(selected => selected.id === tag.id)
  )

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">标签</Label>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/tags" target="_blank">
            <Settings className="h-4 w-4 mr-1" />
            管理标签
          </Link>
        </Button>
      </div>
      
      {/* 已选择的标签 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 添加标签选择器 */}
      {unselectedTags.length > 0 ? (
        <Select onValueChange={handleAddTag}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择标签..." />
          </SelectTrigger>
          <SelectContent>
            {unselectedTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id.toString()}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : availableTags.length === 0 ? (
        <div className="text-center py-4 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">暂无可用标签</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/tags" target="_blank">
              <Plus className="h-4 w-4 mr-1" />
              创建标签
            </Link>
          </Button>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">所有标签都已选择</p>
        </div>
      )}
    </div>
  )
} 