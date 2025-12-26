'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* SVG Logo - 墨舟：墨滴化作小舟的意象 */}
      <svg
        viewBox="0 0 36 36"
        className="w-9 h-9 transition-all duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景圆 */}
        <circle
          cx="18"
          cy="18"
          r="17"
          className="fill-primary/10 dark:fill-accent/10 transition-colors"
        />

        {/* 墨滴 - 上半部分 */}
        <path
          d="M18 6C18 6 12 12 12 17C12 20.3 14.7 23 18 23C21.3 23 24 20.3 24 17C24 12 18 6 18 6Z"
          className="fill-primary dark:fill-accent transition-colors"
        />

        {/* 墨滴高光 */}
        <ellipse
          cx="15.5"
          cy="14"
          rx="2"
          ry="2.5"
          className="fill-background/50"
        />

        {/* 小舟 - 下半部分 */}
        <path
          d="M8 28C8 28 10 30 18 30C26 30 28 28 28 28L22 25C20.8 25.6 19.5 26 18 26C16.5 26 15.2 25.6 14 25L8 28Z"
          className="fill-primary dark:fill-accent transition-colors"
        />

        {/* 涟漪 */}
        <path
          d="M11 29.5Q14.5 30 18 30Q21.5 30 25 29.5"
          className="stroke-primary/40 dark:stroke-accent/40 transition-colors"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
