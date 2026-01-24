import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_URLS_PER_REQUEST = 10

// 从环境变量获取 OSS 域名配置
const OSS_DOMAIN = process.env.NEXT_PUBLIC_OSS_DOMAIN || ''
const OSS_PATH_PREFIX = process.env.NEXT_PUBLIC_OSS_PATH_PREFIX || '/blog'

interface MigrationResult {
  originalUrl: string
  newUrl: string
  error?: string
}

/**
 * 判断 URL 是否为自有 OSS 图片
 */
function isOwnOssUrl(url: string): boolean {
  if (!OSS_DOMAIN) return false

  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === OSS_DOMAIN &&
      parsed.pathname.startsWith(OSS_PATH_PREFIX)
    )
  } catch {
    return false
  }
}

/**
 * 从 URL 中提取文件名
 */
function extractFileName(url: string, contentType: string): string {
  try {
    const parsed = new URL(url)
    const pathParts = parsed.pathname.split('/')
    const originalName = pathParts[pathParts.length - 1] || 'image'

    // 确保有正确的扩展名
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    if (!originalName.includes('.')) {
      return `${originalName}.${ext}`
    }

    return decodeURIComponent(originalName)
  } catch {
    return `image.${contentType.split('/')[1] || 'jpg'}`
  }
}

/**
 * 下载并迁移单张图片
 */
async function migrateImage(url: string): Promise<MigrationResult> {
  // 1. 下载图片
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 秒超时

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogImageMigrator/1.0)'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    // 2. 验证 Content-Type
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid content type: not an image')
    }

    // 3. 获取图片数据
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. 验证文件大小
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
    }

    // 5. 生成文件名
    const fileName = extractFileName(url, contentType)

    // 6. 上传到 OSS
    const newUrl = await uploadToOSS(buffer, fileName)

    return {
      originalUrl: url,
      newUrl
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        createErrorResponse('4001', 'No URLs provided'),
        { status: 400 }
      )
    }

    // 限制单次迁移数量
    if (urls.length > MAX_URLS_PER_REQUEST) {
      return NextResponse.json(
        createErrorResponse('4002', `Maximum ${MAX_URLS_PER_REQUEST} images per request`),
        { status: 400 }
      )
    }

    const migrations: MigrationResult[] = []

    // 并行处理所有图片迁移
    const results = await Promise.allSettled(
      urls.map(async (url: string) => {
        // 跳过已经是自有 OSS 的图片
        if (isOwnOssUrl(url)) {
          return null
        }

        return migrateImage(url)
      })
    )

    // 收集结果
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const url = urls[i]

      if (result.status === 'fulfilled' && result.value) {
        migrations.push(result.value)
      } else if (result.status === 'rejected') {
        migrations.push({
          originalUrl: url,
          newUrl: url, // 失败时保留原 URL
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        })
      }
      // fulfilled 但 value 为 null 表示是自有 OSS 图片，跳过
    }

    return NextResponse.json(
      createSuccessResponse({ migrations })
    )
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      createErrorResponse('5000', 'Migration failed'),
      { status: 500 }
    )
  }
}
