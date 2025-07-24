import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'
import { createSlug, extractSummary, markdownToHtml } from '@/lib/markdown'

// 获取文章列表（公开或认证用户）
async function handleGetPosts(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const status = searchParams.get('status') // 只有作者可以查看草稿

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
    status?: 'PUBLISHED' | { in: ('PUBLISHED' | 'DRAFT')[] }
    deletedAt: null
    authorId?: number
    tags?: { some: { tag: { slug: string } } }
    OR?: Array<{ title?: { contains: string }, summary?: { contains: string }, contentMd?: { contains: string } }>
  } = {
    deletedAt: null
  }

  // 根据status参数和用户身份决定查询条件
  if (status === 'ALL' && currentUser) {
    // 认证用户查看自己的所有文章
    where.authorId = currentUser.id
    // 不设置status限制，可以看到所有状态的文章
  } else {
    // 默认只查询已发布的文章
    where.status = 'PUBLISHED'
  }

  // 如果有标签筛选
  if (tag) {
    where.tags = {
      some: {
        tag: {
          slug: tag
        }
      }
    }
  }

  // 如果有搜索关键词
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
      { contentMd: { contains: q } }
    ]
  }

  // 调试日志
  console.log('查询参数:', { status, currentUser: currentUser?.id, where })

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.post.count({ where })
  ])
  
  console.log('查询结果:', { postsCount: posts.length, total })

  const items = posts.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary || extractSummary(post.contentMd),
    publishAt: post.publishAt,
    status: post.status,
    updatedAt: post.updatedAt,
    tags: post.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug
    })),
    coverUrl: post.coverUrl
  }))

  return NextResponse.json(
    createSuccessResponse({
      items,
      page,
      pageSize,
      total,
      // 添加当前查询的状态信息，便于前端处理
      queryStatus: status === 'ALL' && currentUser ? 'ALL' : 'PUBLISHED',
      isAuthenticated: !!currentUser
    })
  )
}

// 创建文章（需要认证）
async function handleCreatePost(req: AuthenticatedRequest) {
  const body = await req.json()
  const { title = '未命名文章' } = body

  const user = req.user!
  const slug = createSlug(title) + '-' + Date.now() // 确保唯一性

  const post = await prisma.post.create({
    data: {
      slug,
      title,
      contentMd: '',
      status: 'DRAFT',
      authorId: user.id
    }
  })

  return NextResponse.json(
    createSuccessResponse({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status
    }, '文章创建成功')
  )
}

export const GET = withErrorHandling(handleGetPosts)
export const POST = withAuth(withErrorHandling(handleCreatePost)) 