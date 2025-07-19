'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

interface TiptapEditorWrapperProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

// 动态导入TiptapEditor以避免SSR问题
const TiptapEditor = dynamic(() => import('./tiptap-editor').then(mod => ({ default: mod.TiptapEditor })), {
  ssr: false,
  loading: () => (
    <div className="border rounded-md min-h-[400px]">
      <div className="border-b p-2 h-12">
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="p-4">
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
})

export function TiptapEditorWrapper({ content, onChange, placeholder, className }: TiptapEditorWrapperProps) {
  return (
    <TiptapEditor 
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  )
} 