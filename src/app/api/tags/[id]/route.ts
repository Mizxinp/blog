import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// 更新标签
async function handleUpdateTag(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const tagId = parseInt(params.id)
  const body = await req.json()
  const { name, slug } = body

  if (!name || !slug) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '标签名称和链接不能为空'),
      { status: 400 }
    )
  }

  // 验证标签存在
  const existingTag = await prisma.tag.findUnique({
    where: { id: tagId }
  })

  if (!existingTag) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, '标签不存在'),
      { status: 404 }
    )
  }

  // 检查slug是否被其他标签使用
  const conflictTag = await prisma.tag.findUnique({
    where: { slug }
  })

  if (conflictTag && conflictTag.id !== tagId) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '标签链接已存在'),
      { status: 409 }
    )
  }

  const updatedTag = await prisma.tag.update({
    where: { id: tagId },
    data: { name, slug }
  })

  return NextResponse.json(
    createSuccessResponse(updatedTag, '标签更新成功')
  )
}

// 删除标签
async function handleDeleteTag(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const tagId = parseInt(params.id)

  // 验证标签存在
  const existingTag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  })

  if (!existingTag) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, '标签不存在'),
      { status: 404 }
    )
  }

  // 检查是否有文章在使用此标签
  if (existingTag._count.posts > 0) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '无法删除正在使用的标签'),
      { status: 400 }
    )
  }

  await prisma.tag.delete({
    where: { id: tagId }
  })

  return NextResponse.json(
    createSuccessResponse({ deleted: true }, '标签删除成功')
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handleUpdateTag(req as AuthenticatedRequest, { params: resolvedParams })))(req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handleDeleteTag(req as AuthenticatedRequest, { params: resolvedParams })))(req)
} 