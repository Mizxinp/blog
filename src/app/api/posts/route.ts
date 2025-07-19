import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'
import { createSlug, extractSummary, markdownToHtml } from '@/lib/markdown'

// 获取文章列表（公开）
async function handleGetPosts(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const status = searchParams.get('status') // 只有作者可以查看草稿

  const skip = (page - 1) * pageSize

  // 构建查询条件
  const where: {
    status: 'PUBLISHED'
    deletedAt: null
    tags?: { some: { tag: { slug: string } } }
    OR?: Array<{ title?: { contains: string }, summary?: { contains: string }, contentMd?: { contains: string } }>
  } = {
    status: 'PUBLISHED', // 默认只查询已发布的文章
    deletedAt: null
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

  // 如果是认证用户查看所有状态（需要在中间件中处理）
  // 这里暂时保持简单，后续可以扩展

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
        publishAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.post.count({ where })
  ])

  const items = posts.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary || extractSummary(post.contentMd),
    publishAt: post.publishAt,
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
      total
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