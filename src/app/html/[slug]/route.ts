import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const htmlPreview = await prisma.htmlPreview.findFirst({
      where: {
        slug,
        status: 'PUBLISHED'
      }
    })

    if (!htmlPreview) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // 直接返回原始 HTML 内容
    return new NextResponse(htmlPreview.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    })
  } catch (error) {
    console.error('获取 HTML 预览失败:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
