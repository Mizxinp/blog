# HTML 预览管理技术文档

**版本**：v1.0.1
**需求文档**：[prd.md](../prds/prd.md)
**创建时间**：2026-01-24

---

## 1. 需求概述

实现一个 HTML 预览管理功能，允许管理员创建、编辑、删除 HTML 片段，用户可以通过特定 URL 直接查看完整的 HTML 内容。功能类似于现有的文章管理系统。

### 1.1 核心功能

1. **后台管理**：管理员可以创建、编辑、删除 HTML 预览
2. **编辑功能**：定义 slug、粘贴完整 HTML、实时预览
3. **前台展示**：用户通过 `/html/{slug}` 访问完整 HTML 内容

### 1.2 核心流程

```
管理员创建 → 输入 slug + HTML 内容 → 保存 → 用户通过 URL 访问
```

---

## 2. 现有代码分析

### 2.1 参考的文章管理结构

```
src/
├── app/
│   ├── admin/
│   │   ├── posts/page.tsx          # 文章列表管理
│   │   └── editor/[id]/page.tsx    # 文章编辑器
│   ├── api/posts/
│   │   ├── route.ts                # GET/POST 文章列表
│   │   ├── [id]/route.ts           # PATCH/DELETE 单篇文章
│   │   └── detail/route.ts         # 获取文章详情
│   └── posts/
│       └── [slug]/page.tsx         # 前台文章展示
└── components/
    └── post-card.tsx               # 文章卡片组件
```

### 2.2 可复用的模式

1. **API 响应格式**：`src/lib/api-response.ts` - 统一的响应结构
2. **认证中间件**：`src/lib/middleware.ts` - `withAuth` 和 `withErrorHandling`
3. **Prisma 操作**：现有的 Post 模型操作模式
4. **卡片组件**：`src/components/post-card.tsx` 的设计模式

---

## 3. 数据库设计

### 3.1 新增 HtmlPreview 表

**文件**：`prisma/schema.prisma`

```prisma
model HtmlPreview {
  id          Int       @id @default(autoincrement())
  slug        String    @unique                          // URL 路径标识
  title       String    @db.VarChar(255)                 // 标题（用于管理列表展示）
  content     String    @db.LongText                     // 完整的 HTML 内容
  status      HtmlPreviewStatus @default(DRAFT)          // 状态：草稿/已发布
  authorId    Int                                        // 创建者 ID
  author      User      @relation(fields: [authorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishAt   DateTime?                                  // 发布时间

  @@index([authorId])
  @@index([status])
  @@map("html_previews")
}

enum HtmlPreviewStatus {
  DRAFT
  PUBLISHED
}
```

### 3.2 更新 User 模型关联

```prisma
model User {
  // ... 现有字段
  htmlPreviews  HtmlPreview[]
}
```

### 3.3 数据库迁移

```bash
# 生成迁移
npx prisma migrate dev --name add_html_preview_table

# 生成 Prisma Client
npx prisma generate
```

---

## 4. 技术方案

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        管理后台                                   │
│  ┌───────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │ /admin/html   │───>│ /admin/html/[id] │───>│ 预览 Modal    │ │
│  │ (列表页)       │    │ (编辑页)          │    │               │ │
│  └───────────────┘    └──────────────────┘    └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API 层                                   │
│  ┌───────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │ GET /api/html │    │ POST /api/html   │    │ PATCH/DELETE  │ │
│  │ (列表)         │    │ (创建)            │    │ /api/html/[id]│ │
│  └───────────────┘    └──────────────────┘    └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         前台展示                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ /html/[slug]  →  全屏渲染 HTML 内容 (iframe 或直接渲染)    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 路由规划

| 路由 | 类型 | 说明 | 认证 |
|------|------|------|------|
| `/admin/html` | 页面 | 管理列表页 | 需要 |
| `/admin/html/[id]` | 页面 | 编辑页面 | 需要 |
| `/html/[slug]` | 页面 | 前台预览页 | 不需要 |
| `GET /api/html` | API | 获取列表 | 可选 |
| `POST /api/html` | API | 创建预览 | 需要 |
| `GET /api/html/[id]` | API | 获取详情 | 可选 |
| `PATCH /api/html/[id]` | API | 更新预览 | 需要 |
| `DELETE /api/html/[id]` | API | 删除预览 | 需要 |
| `POST /api/html/[id]/publish` | API | 发布预览 | 需要 |

---

## 5. 实现细节

### 5.1 后端 API 实现

#### 5.1.1 列表与创建 API

**文件**：`src/app/api/html/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, AuthenticatedRequest } from '@/lib/middleware'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { createSlug } from '@/lib/utils'

// GET /api/html - 获取列表
async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'ALL'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')

  const where: any = {}

  // 未认证用户只能看到已发布的
  const isAuthenticated = req.headers.get('x-user-id')
  if (!isAuthenticated) {
    where.status = 'PUBLISHED'
  } else if (status !== 'ALL') {
    where.status = status
  }

  const [items, total] = await Promise.all([
    prisma.htmlPreview.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        publishAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.htmlPreview.count({ where })
  ])

  return NextResponse.json(createSuccessResponse({
    items,
    page,
    pageSize,
    total
  }))
}

// POST /api/html - 创建新预览
async function handlePost(req: AuthenticatedRequest) {
  const { title = '未命名预览' } = await req.json()

  const slug = `${createSlug(title)}-${Date.now()}`

  const htmlPreview = await prisma.htmlPreview.create({
    data: {
      title,
      slug,
      content: '',
      status: 'DRAFT',
      authorId: req.user!.id
    }
  })

  return NextResponse.json(createSuccessResponse(htmlPreview), { status: 201 })
}

export const GET = withErrorHandling(handleGet)
export const POST = withAuth(withErrorHandling(handlePost))
```

#### 5.1.2 单个预览操作 API

**文件**：`src/app/api/html/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, AuthenticatedRequest } from '@/lib/middleware'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'

// GET /api/html/[id] - 获取详情
async function handleGet(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const htmlPreview = await prisma.htmlPreview.findUnique({
    where: { id: parseInt(id) },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  if (!htmlPreview) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, 'HTML 预览不存在'),
      { status: 404 }
    )
  }

  return NextResponse.json(createSuccessResponse(htmlPreview))
}

// PATCH /api/html/[id] - 更新预览
async function handlePatch(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { title, slug, content } = await req.json()

  const existing = await prisma.htmlPreview.findUnique({
    where: { id: parseInt(id) }
  })

  if (!existing) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, 'HTML 预览不存在'),
      { status: 404 }
    )
  }

  // 权限检查
  if (existing.authorId !== req.user!.id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限编辑'),
      { status: 403 }
    )
  }

  // Slug 格式验证
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Slug 只能包含小写字母、数字和连字符'),
      { status: 400 }
    )
  }

  // Slug 唯一性检查
  if (slug && slug !== existing.slug) {
    const slugExists = await prisma.htmlPreview.findFirst({
      where: { slug, id: { not: parseInt(id) } }
    })
    if (slugExists) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Slug 已被使用'),
        { status: 400 }
      )
    }
  }

  const updated = await prisma.htmlPreview.update({
    where: { id: parseInt(id) },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
    }
  })

  return NextResponse.json(createSuccessResponse(updated))
}

// DELETE /api/html/[id] - 删除预览
async function handleDelete(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.htmlPreview.findUnique({
    where: { id: parseInt(id) }
  })

  if (!existing) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, 'HTML 预览不存在'),
      { status: 404 }
    )
  }

  if (existing.authorId !== req.user!.id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限删除'),
      { status: 403 }
    )
  }

  await prisma.htmlPreview.delete({
    where: { id: parseInt(id) }
  })

  return NextResponse.json(createSuccessResponse({ message: '删除成功' }))
}

export const GET = withErrorHandling(handleGet)
export const PATCH = withAuth(withErrorHandling(handlePatch))
export const DELETE = withAuth(withErrorHandling(handleDelete))
```

#### 5.1.3 发布 API

**文件**：`src/app/api/html/[id]/publish/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, AuthenticatedRequest } from '@/lib/middleware'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'

async function handlePost(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.htmlPreview.findUnique({
    where: { id: parseInt(id) }
  })

  if (!existing) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, 'HTML 预览不存在'),
      { status: 404 }
    )
  }

  if (existing.authorId !== req.user!.id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限发布'),
      { status: 403 }
    )
  }

  // 验证必填项
  if (!existing.title || !existing.content) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.VALIDATION_ERROR, '标题和内容不能为空'),
      { status: 400 }
    )
  }

  const updated = await prisma.htmlPreview.update({
    where: { id: parseInt(id) },
    data: {
      status: 'PUBLISHED',
      publishAt: new Date()
    }
  })

  return NextResponse.json(createSuccessResponse(updated))
}

export const POST = withAuth(withErrorHandling(handlePost))
```

#### 5.1.4 根据 Slug 获取详情 API

**文件**：`src/app/api/html/detail/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/middleware'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'

async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  if (!slug && !id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.VALIDATION_ERROR, '需要提供 slug 或 id'),
      { status: 400 }
    )
  }

  const where = slug
    ? { slug, status: 'PUBLISHED' as const }
    : { id: parseInt(id!) }

  const htmlPreview = await prisma.htmlPreview.findFirst({
    where
  })

  if (!htmlPreview) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, 'HTML 预览不存在'),
      { status: 404 }
    )
  }

  return NextResponse.json(createSuccessResponse(htmlPreview))
}

export const GET = withErrorHandling(handleGet)
```

### 5.2 前端页面实现

#### 5.2.1 管理列表页

**文件**：`src/app/admin/html/page.tsx`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface HtmlPreview {
  id: number
  slug: string
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  updatedAt: string
  publishAt: string | null
}

export default function HtmlManagementPage() {
  const router = useRouter()
  const [items, setItems] = useState<HtmlPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/html?status=ALL')
      const data = await res.json()
      if (data.code === '0') {
        setItems(data.result.items)
      }
    } catch (error) {
      toast.error('获取列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '未命名预览' })
      })
      const data = await res.json()
      if (data.code === '0') {
        router.push(`/admin/html/${data.result.id}`)
      } else {
        toast.error(data.message || '创建失败')
      }
    } catch (error) {
      toast.error('创建失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/html/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === '0') {
        toast.success('删除成功')
        fetchItems()
      } else {
        toast.error(data.message || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setDeleteId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest mb-2">— Management —</p>
          <h1 className="text-2xl font-medium tracking-wide">HTML 预 览 管 理</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新建预览
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-border bg-card">
          <CardHeader className="text-center py-12">
            <CardDescription>暂无 HTML 预览，点击上方按钮创建</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="border-border bg-card hover:shadow-lg dark:hover:shadow-[0_0_20px_var(--accent-glow)] transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-medium line-clamp-1">
                    {item.title}
                  </CardTitle>
                  <Badge variant={item.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {item.status === 'PUBLISHED' ? '已发布' : '草稿'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  /{item.slug}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between pt-0">
                <span className="text-xs text-muted-foreground">
                  更新于 {formatDate(item.updatedAt)}
                </span>
                <div className="flex gap-1">
                  {item.status === 'PUBLISHED' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`/html/${item.slug}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/admin/html/${item.id}`)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

#### 5.2.2 编辑页面

**文件**：`src/app/admin/html/[id]/page.tsx`

```typescript
'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface HtmlPreview {
  id: number
  slug: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED'
  publishAt: string | null
}

export default function HtmlEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [data, setData] = useState<HtmlPreview | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')

  // 获取详情
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/html/${id}`)
      const result = await res.json()
      if (result.code === '0') {
        setData(result.result)
        setTitle(result.result.title)
        setSlug(result.result.slug)
        setContent(result.result.content)
      } else {
        toast.error('获取数据失败')
        router.push('/admin/html')
      }
    } catch (error) {
      toast.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入标题')
      return
    }
    if (!slug.trim()) {
      toast.error('请输入 Slug')
      return
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast.error('Slug 只能包含小写字母、数字和连字符')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/html/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content })
      })
      const result = await res.json()
      if (result.code === '0') {
        setData(result.result)
        toast.success('保存成功')
      } else {
        toast.error(result.message || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 发布
  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error('请先输入 HTML 内容')
      return
    }

    // 先保存
    await handleSave()

    setPublishing(true)
    try {
      const res = await fetch(`/api/html/${id}/publish`, {
        method: 'POST'
      })
      const result = await res.json()
      if (result.code === '0') {
        setData(result.result)
        toast.success('发布成功')
      } else {
        toast.error(result.message || '发布失败')
      }
    } catch (error) {
      toast.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/html')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Badge variant={data?.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {data?.status === 'PUBLISHED' ? '已发布' : '草稿'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
            {data?.status !== 'PUBLISHED' && (
              <Button onClick={handlePublish} disabled={publishing}>
                <Send className="w-4 h-4 mr-2" />
                {publishing ? '发布中...' : '发布'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="container py-6 max-w-4xl">
        <div className="space-y-6">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入标题"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              访问链接
              <span className="text-muted-foreground ml-2 font-normal">
                /html/{slug || 'your-slug'}
              </span>
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="请输入 slug（小写字母、数字、连字符）"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          {/* HTML 内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">HTML 内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请粘贴完整的 HTML 内容..."
              className="min-h-[500px] font-mono text-sm bg-card border-border focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 预览 Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>预览 - {title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <iframe
              srcDoc={content}
              className="w-full h-full min-h-[70vh] border-0"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

#### 5.2.3 前台预览页

**文件**：`src/app/html/[slug]/page.tsx`

```typescript
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

async function getHtmlPreview(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/html/detail?slug=${slug}`, {
      cache: 'no-store'
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.code === '0' ? data.result : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const preview = await getHtmlPreview(slug)

  return {
    title: preview?.title || 'HTML 预览',
    robots: 'noindex, nofollow' // 不被搜索引擎索引
  }
}

export default async function HtmlPreviewPage({ params }: Props) {
  const { slug } = await params
  const preview = await getHtmlPreview(slug)

  if (!preview) {
    notFound()
  }

  return (
    <html>
      <head>
        <title>{preview.title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: preview.content }} />
      </body>
    </html>
  )
}
```

#### 5.2.4 更新管理后台导航

**文件**：`src/app/admin/page.tsx` (修改)

在管理卡片列表中添加 HTML 预览管理入口：

```typescript
// 在现有导航卡片数组中添加
{
  title: 'HTML 预览管理',
  description: '管理和发布 HTML 预览页面',
  href: '/admin/html',
  icon: Code // 需要 import { Code } from 'lucide-react'
}
```

---

## 6. 安全考虑

### 6.1 XSS 防护

前台预览页面使用 `dangerouslySetInnerHTML` 直接渲染用户输入的 HTML，存在 XSS 风险。建议：

1. **仅限管理员创建**：通过 `withAuth` 中间件确保只有认证用户可以创建
2. **内容审查**：管理员发布前需要预览确认内容安全
3. **noindex 标记**：前台页面添加 `noindex` 防止被搜索引擎收录

### 6.2 权限控制

- 创建、编辑、删除、发布操作均需认证
- 编辑和删除需要检查 `authorId` 匹配
- 未发布内容仅作者可见

### 6.3 Slug 验证

- 只允许小写字母、数字和连字符
- 数据库 unique 约束防止重复
- 更新时检查唯一性

---

## 7. 文件变更清单

| 文件路径 | 变更类型 | 说明 |
|----------|----------|------|
| `prisma/schema.prisma` | 修改 | 添加 HtmlPreview 模型和枚举 |
| `src/app/api/html/route.ts` | 新增 | 列表和创建 API |
| `src/app/api/html/[id]/route.ts` | 新增 | 详情、更新、删除 API |
| `src/app/api/html/[id]/publish/route.ts` | 新增 | 发布 API |
| `src/app/api/html/detail/route.ts` | 新增 | 根据 slug 获取详情 |
| `src/app/admin/html/page.tsx` | 新增 | 管理列表页 |
| `src/app/admin/html/[id]/page.tsx` | 新增 | 编辑页 |
| `src/app/html/[slug]/page.tsx` | 新增 | 前台预览页 |
| `src/app/admin/page.tsx` | 修改 | 添加导航入口 |

---

## 8. 测试用例

### 8.1 API 测试

| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 创建预览 | POST /api/html | 返回新创建的记录，状态为 DRAFT |
| 获取列表（认证） | GET /api/html?status=ALL | 返回所有状态的记录 |
| 获取列表（未认证） | GET /api/html | 仅返回 PUBLISHED 状态的记录 |
| 更新预览 | PATCH /api/html/[id] | 成功更新，返回更新后的记录 |
| Slug 格式错误 | PATCH with invalid slug | 返回 400 错误 |
| Slug 重复 | PATCH with duplicate slug | 返回 400 错误 |
| 删除预览 | DELETE /api/html/[id] | 成功删除 |
| 发布预览 | POST /api/html/[id]/publish | 状态变为 PUBLISHED |
| 访问已发布 | GET /html/[slug] | 渲染 HTML 内容 |
| 访问草稿 | GET /html/[slug] | 返回 404 |

### 8.2 UI 测试

| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 新建预览 | 点击"新建预览"按钮 | 跳转到编辑页 |
| 保存草稿 | 输入内容后点击保存 | 显示保存成功 |
| 预览功能 | 点击预览按钮 | 弹出预览 Dialog |
| 发布 | 点击发布按钮 | 状态变为已发布 |
| 删除 | 点击删除按钮 | 弹出确认框，确认后删除 |

---

## 9. 实施步骤

### 步骤 1：数据库变更
1. 更新 `prisma/schema.prisma` 添加 HtmlPreview 模型
2. 运行 `npx prisma migrate dev --name add_html_preview_table`
3. 运行 `npx prisma generate`

### 步骤 2：后端 API
1. 创建 `src/app/api/html/route.ts`
2. 创建 `src/app/api/html/[id]/route.ts`
3. 创建 `src/app/api/html/[id]/publish/route.ts`
4. 创建 `src/app/api/html/detail/route.ts`

### 步骤 3：前端页面
1. 创建 `src/app/admin/html/page.tsx`
2. 创建 `src/app/admin/html/[id]/page.tsx`
3. 创建 `src/app/html/[slug]/page.tsx`
4. 更新 `src/app/admin/page.tsx` 添加导航

### 步骤 4：测试验证
1. 测试完整的创建-编辑-发布-查看流程
2. 测试权限控制
3. 测试边界情况

---

## 10. 后续优化建议

1. **版本控制**：记录 HTML 内容的修改历史
2. **访问统计**：记录预览页面的访问次数
3. **过期时间**：支持设置预览链接的有效期
4. **密码保护**：支持给特定预览设置访问密码
5. **批量操作**：支持批量删除、批量发布
6. **搜索功能**：支持按标题搜索
