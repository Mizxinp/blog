import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'

// 允许的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        createErrorResponse('4001', 'No file provided'),
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        createErrorResponse('4002', `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`),
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        createErrorResponse('4003', `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`),
        { status: 400 }
      )
    }

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到 OSS
    const url = await uploadToOSS(buffer, file.name)

    return NextResponse.json(
      createSuccessResponse({ url })
    )
  } catch (error) {
    console.error('Upload error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Upload failed'

    // 检查是否是 OSS 配置错误
    if (errorMessage.includes('OSS configuration')) {
      return NextResponse.json(
        createErrorResponse('5001', 'Server configuration error'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      createErrorResponse('5000', errorMessage),
      { status: 500 }
    )
  }
}
