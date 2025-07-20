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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '标签管理',
      description: '管理文章标签，添加、编辑和删除标签分类',
      icon: Tags,
      href: '/admin/tags',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '系统设置',
      description: '配置博客系统设置和偏好选项',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: '数据统计',
      description: '查看博客访问数据和文章统计信息',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">管理中心</h1>
        <p className="text-muted-foreground">欢迎来到博客管理中心，选择您要管理的功能</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {adminCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
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