import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'
import { markdownToHtml, extractSummary } from '@/lib/markdown'

// 更新文章
async function handleUpdatePost(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const postId = parseInt(params.id)
  const body = await req.json()
  
  const { title, contentMd, summary, tags, coverUrl } = body

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
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限编辑此文章'),
      { status: 403 }
    )
  }

  // 准备更新数据
  const updateData: {
    title?: string
    contentMd?: string
    contentHtml?: string
    summary?: string | null
    coverUrl?: string | null
  } = {}
  
  if (title !== undefined) updateData.title = title
  if (contentMd !== undefined) {
    updateData.contentMd = contentMd
    // 重新生成 HTML 缓存
    updateData.contentHtml = await markdownToHtml(contentMd)
  }
  if (summary !== undefined) {
    updateData.summary = summary
  } else if (contentMd !== undefined) {
    // 如果更新了内容但没有提供摘要，自动生成摘要
    updateData.summary = extractSummary(contentMd)
  }
  if (coverUrl !== undefined) updateData.coverUrl = coverUrl

  // 更新文章
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: updateData
  })

  // 处理标签关联
  if (tags && Array.isArray(tags)) {
    // 删除现有标签关联
    await prisma.postTag.deleteMany({
      where: { postId }
    })

    // 创建新的标签关联
    if (tags.length > 0) {
      await prisma.postTag.createMany({
        data: tags.map((tagId: number) => ({
          postId,
          tagId
        }))
      })
    }
  }

  return NextResponse.json(
    createSuccessResponse({
      id: updatedPost.id,
      updatedAt: updatedPost.updatedAt
    }, '文章更新成功')
  )
}

// 删除文章（软删除）
async function handleDeletePost(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const postId = parseInt(params.id)

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
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限删除此文章'),
      { status: 403 }
    )
  }

  // 软删除
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'DELETED_SOFT',
      deletedAt: new Date()
    }
  })

  return NextResponse.json(
    createSuccessResponse({ deleted: true }, '文章删除成功')
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handleUpdatePost(req as AuthenticatedRequest, { params: resolvedParams })))(req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handleDeletePost(req as AuthenticatedRequest, { params: resolvedParams })))(req)
} 