'use client'

import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'blog-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // 初始化：从 localStorage 读取主题
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored)
    }
  }, [])

  // 应用主题
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      let isDark: boolean
      if (theme === 'system') {
        isDark = mediaQuery.matches
      } else {
        isDark = theme === 'dark'
      }

      root.classList.toggle('dark', isDark)
      setResolvedTheme(isDark ? 'dark' : 'light')
    }

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)

    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }, [])

  // 循环切换主题
  const cycleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }, [theme, setTheme])

  // 切换明暗模式（不包含 system）
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  return {
    theme,
    resolvedTheme,
    setTheme,
    cycleTheme,
    toggleTheme,
    mounted,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  }
}
