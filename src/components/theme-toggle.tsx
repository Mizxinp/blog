'use client'

import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme, mounted } = useTheme()

  // 避免服务端渲染不匹配
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn("w-9 h-9", className)} disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const Icon = isDark ? Moon : Sun
  const label = isDark ? '暗黑模式' : '日常模式'
  const title = isDark ? '切换到日常模式' : '切换到暗黑模式'

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={cn("gap-2", className)}
        title={title}
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("w-9 h-9", className)}
      title={title}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{title}</span>
    </Button>
  )
}
