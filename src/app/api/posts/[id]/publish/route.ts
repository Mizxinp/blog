import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// 发布文章
async function handlePublishPost(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const postId = parseInt(params.id)
  const body = await req.json()
  const { publishAt } = body

  // 验证文章存在和权限
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true }
  })

  if (!existingPost) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, '文章不存在'),
      { status: 404 }
    )
  }

  if (existingPost.authorId !== req.user!.id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限发布此文章'),
      { status: 403 }
    )
  }

  // 验证文章内容
  if (!existingPost.title || !existingPost.contentMd) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '文章标题和内容不能为空'),
      { status: 400 }
    )
  }

  // 设置发布时间，如果没有指定则使用当前时间
  const publishTime = publishAt ? new Date(publishAt) : new Date()

  // 更新文章状态
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'PUBLISHED',
      publishAt: publishTime
    }
  })

  return NextResponse.json(
    createSuccessResponse({
      id: updatedPost.id,
      slug: updatedPost.slug,
      status: updatedPost.status,
      publishAt: updatedPost.publishAt
    }, '文章发布成功')
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handlePublishPost(req as AuthenticatedRequest, { params: resolvedParams })))(req)
} 