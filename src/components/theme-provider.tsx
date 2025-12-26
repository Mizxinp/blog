'use client'

import { useEffect, useState } from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // 初始化主题
    const stored = localStorage.getItem('blog-theme')
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      let isDark: boolean
      if (stored === 'dark') {
        isDark = true
      } else if (stored === 'light') {
        isDark = false
      } else {
        // system 或未设置
        isDark = mediaQuery.matches
      }
      root.classList.toggle('dark', isDark)
    }

    applyTheme()

    // 监听系统主题变化
    const handleChange = () => {
      const currentStored = localStorage.getItem('blog-theme')
      if (!currentStored || currentStored === 'system') {
        root.classList.toggle('dark', mediaQuery.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 避免闪烁 - 在脚本中提前设置主题
  if (!mounted) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('blog-theme');
                  var isDark = theme === 'dark' ||
                    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.toggle('dark', isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </>
    )
  }

  return <>{children}</>
}
