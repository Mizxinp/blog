import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'
import { createSlug } from '@/lib/markdown'

// GET /api/html - 获取列表
async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'ALL'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')

  const skip = (page - 1) * pageSize

  // 检查是否为认证用户
  let currentUser = null
  try {
    const token = req.cookies.get('auth-token')?.value ||
                 req.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      const { verifyToken } = await import('@/lib/auth')
      currentUser = verifyToken(token)
    }
  } catch (error) {
    // 忽略认证错误，继续作为匿名用户处理
  }

  // 构建查询条件
  const where: {
    status?: 'PUBLISHED' | 'DRAFT'
    authorId?: number
  } = {}

  // 根据status参数和用户身份决定查询条件
  if (status === 'ALL' && currentUser) {
    // 认证用户查看自己的所有预览
    where.authorId = currentUser.id
  } else {
    // 默认只查询已发布的
    where.status = 'PUBLISHED'
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
      skip,
      take: pageSize,
    }),
    prisma.htmlPreview.count({ where })
  ])

  return NextResponse.json(createSuccessResponse({
    items,
    page,
    pageSize,
    total,
    isAuthenticated: !!currentUser
  }))
}

// POST /api/html - 创建新预览
async function handlePost(req: AuthenticatedRequest) {
  const { title = '未命名预览' } = await req.json()

  const user = req.user!
  const baseSlug = title.trim() ? createSlug(title) : 'untitled'
  const slug = baseSlug + '-' + Date.now()

  const htmlPreview = await prisma.htmlPreview.create({
    data: {
      title,
      slug,
      content: '',
      status: 'DRAFT',
      authorId: user.id
    }
  })

  return NextResponse.json(
    createSuccessResponse({
      id: htmlPreview.id,
      slug: htmlPreview.slug,
      title: htmlPreview.title,
      status: htmlPreview.status
    }, '创建成功'),
    { status: 201 }
  )
}

export const GET = withErrorHandling(handleGet)
export const POST = withAuth(withErrorHandling(handlePost))
