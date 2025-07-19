import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api-response'
import { withErrorHandling } from '@/lib/middleware'

async function handleLogin(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '方法不被允许'),
      { status: 405 }
    )
  }

  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.PARAM_ERROR, '邮箱和密码不能为空'),
      { status: 400 }
    )
  }

  const user = await authenticateUser(email, password)
  if (!user) {
    return NextResponse.json(
      createErrorResponse(ErrorCodes.UNAUTHORIZED, '邮箱或密码错误'),
      { status: 401 }
    )
  }

  const token = generateToken(user)
  
  const response = NextResponse.json(
    createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    }, '登录成功')
  )

  // 设置 HTTP-only cookie
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 天
  })

  return response
}

export const POST = withErrorHandling(handleLogin) 