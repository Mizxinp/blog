import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling } from '@/lib/middleware'
import { markdownToHtml } from '@/lib/markdown'

// 获取文章详情
async function handleGetPost(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  if (!slug && !id) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '缺少 slug 或 id 参数'),
      { status: 400 }
    )
  }

  const whereClause = slug ? { slug } : { id: parseInt(id!) }
  
  const post = await prisma.post.findUnique({
    where: whereClause,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!post) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, '文章不存在'),
      { status: 404 }
    )
  }

  // 如果是通过 slug 访问的草稿，需要验证权限（暂时简化处理）
  if (slug && post.status !== 'PUBLISHED') {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.NOT_FOUND, '文章不存在或未发布'),
      { status: 404 }
    )
  }

  // 生成 HTML 内容（如果还没有缓存）
  let contentHtml = post.contentHtml
  if (!contentHtml && post.contentMd) {
    contentHtml = await markdownToHtml(post.contentMd)
    // 可以选择更新数据库缓存
    await prisma.post.update({
      where: { id: post.id },
      data: { contentHtml }
    })
  }

  const result = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    contentHtml,
    contentMd: post.contentMd,
    status: post.status,
    publishAt: post.publishAt,
    updatedAt: post.updatedAt,
    tags: post.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug
    })),
    coverUrl: post.coverUrl,
    author: post.author
  }

  return NextResponse.json(createSuccessResponse(result))
}

export const GET = withErrorHandling(handleGetPost) 