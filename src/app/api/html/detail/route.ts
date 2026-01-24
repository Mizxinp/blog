import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling } from '@/lib/middleware'

// GET /api/html/detail?slug=xxx 或 ?id=xxx
async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  if (!slug && !id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '需要提供 slug 或 id'),
      { status: 400 }
    )
  }

  // 通过 slug 查询只返回已发布的，通过 id 查询返回所有
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
