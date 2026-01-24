import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// POST /api/html/[id]/publish - 发布预览
async function handlePost(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  const existing = await prisma.htmlPreview.findUnique({
    where: { id }
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
  if (!existing.title.trim()) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '标题不能为空'),
      { status: 400 }
    )
  }

  if (!existing.content.trim()) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, 'HTML 内容不能为空'),
      { status: 400 }
    )
  }

  const updated = await prisma.htmlPreview.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishAt: new Date()
    }
  })

  return NextResponse.json(createSuccessResponse(updated, '发布成功'))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handlePost(req as AuthenticatedRequest, { params: resolvedParams })))(req)
}
