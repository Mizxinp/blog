import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse } from '@/lib/api-response'
import { withErrorHandling } from '@/lib/middleware'

async function handleLogout(req: NextRequest) {
  const response = NextResponse.json(
    createSuccessResponse(null, '登出成功')
  )

  // 清除 cookie
  response.cookies.delete('auth-token')

  return response
}

export const POST = withErrorHandling(handleLogout) 