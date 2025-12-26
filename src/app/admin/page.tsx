'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Tags, Settings, BarChart3 } from 'lucide-react'

export default function AdminPage() {
  const adminCards = [
    {
      title: '文章管理',
      description: '管理您的博客文章，创建、编辑、发布和删除文章',
      icon: FileText,
      href: '/admin/posts',
    },
    {
      title: '标签管理',
      description: '管理文章标签，添加、编辑和删除标签分类',
      icon: Tags,
      href: '/admin/tags',
    },
    {
      title: '系统设置',
      description: '配置博客系统设置和偏好选项',
      icon: Settings,
      href: '/admin/settings',
    },
    {
      title: '数据统计',
      description: '查看博客访问数据和文章统计信息',
      icon: BarChart3,
      href: '/admin/analytics',
    },
  ]

  return (
    <div className="container py-8">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground tracking-widest mb-2">— Dashboard —</p>
        <h1 className="text-3xl font-medium tracking-wide text-foreground">管 理 中 心</h1>
        <p className="text-muted-foreground mt-2">欢迎来到博客管理中心，选择您要管理的功能</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {adminCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href} className="group">
              <Card className="neo-card h-full border-border bg-card cursor-pointer relative overflow-hidden
                transition-all duration-300 ease-in-out hover:shadow-lg">
                {/* 日间模式：左侧装饰线 */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:hidden" />
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="neo-tag p-3 rounded bg-accent-soft transition-all">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">{card.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 