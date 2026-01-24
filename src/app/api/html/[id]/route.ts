import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling, withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// GET /api/html/[id] - 获取详情
async function handleGet(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  const htmlPreview = await prisma.htmlPreview.findUnique({
    where: { id },
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
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const { title, slug, content } = await req.json()

  const existing = await prisma.htmlPreview.findUnique({
    where: { id }
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
  if (slug !== undefined) {
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.PARAM_ERROR, 'Slug 只能包含小写字母、数字和连字符'),
        { status: 400 }
      )
    }

    // Slug 唯一性检查
    if (slug !== existing.slug) {
      const slugExists = await prisma.htmlPreview.findFirst({
        where: { slug, id: { not: id } }
      })
      if (slugExists) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.PARAM_ERROR, 'Slug 已被使用'),
          { status: 409 }
        )
      }
    }
  }

  // 准备更新数据
  const updateData: {
    title?: string
    slug?: string
    content?: string
  } = {}

  if (title !== undefined) updateData.title = title
  if (slug !== undefined) updateData.slug = slug
  if (content !== undefined) updateData.content = content

  const updated = await prisma.htmlPreview.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json(createSuccessResponse(updated, '保存成功'))
}

// DELETE /api/html/[id] - 删除预览
async function handleDelete(
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
      createErrorResponse(ErrorCodes.FORBIDDEN, '无权限删除'),
      { status: 403 }
    )
  }

  await prisma.htmlPreview.delete({
    where: { id }
  })

  return NextResponse.json(createSuccessResponse({ deleted: true }, '删除成功'))
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withErrorHandling(() => handleGet(req, { params: resolvedParams }))(req)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handlePatch(req as AuthenticatedRequest, { params: resolvedParams })))(req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return withAuth(withErrorHandling(() => handleDelete(req as AuthenticatedRequest, { params: resolvedParams })))(req)
}
