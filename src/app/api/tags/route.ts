import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/api-response'
import { withErrorHandling } from '@/lib/middleware'

// 获取所有标签
async function handleGetTags(req: NextRequest) {
  const tags = await prisma.tag.findMany({
    include: {
      posts: {
        where: {
          post: {
            status: 'PUBLISHED',
            deletedAt: null
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  const result = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag.posts.length
  })).filter(tag => tag.postCount > 0) // 只返回有文章的标签

  return NextResponse.json(createSuccessResponse(result))
}

export const GET = withErrorHandling(handleGetTags) 