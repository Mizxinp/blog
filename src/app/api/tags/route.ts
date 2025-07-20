import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// 获取所有标签
async function handleGetTags(req: NextRequest) {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  })

  return NextResponse.json(
    createSuccessResponse(tags, '获取标签列表成功')
  )
}

// 创建新标签
async function handleCreateTag(req: AuthenticatedRequest) {
  const body = await req.json()
  const { name, slug } = body

  if (!name || !slug) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '标签名称和链接不能为空'),
      { status: 400 }
    )
  }

  // 检查slug是否已存在
  const existingTag = await prisma.tag.findUnique({
    where: { slug }
  })

  if (existingTag) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '标签链接已存在'),
      { status: 409 }
    )
  }

  const tag = await prisma.tag.create({
    data: { name, slug }
  })

  return NextResponse.json(
    createSuccessResponse(tag, '标签创建成功'),
    { status: 201 }
  )
}

export const GET = withErrorHandling(handleGetTags)

export const POST = withAuth(withErrorHandling(handleCreateTag)) 