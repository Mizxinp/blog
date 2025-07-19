import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type AuthUser } from './auth'
import { createErrorResponse, ErrorCodes } from './api-response'

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      // 从 cookie 或 Authorization header 获取 token
      const token = req.cookies.get('auth-token')?.value || 
                   req.headers.get('authorization')?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, '未授权访问'),
          { status: 401 }
        )
      }

      const user = verifyToken(token)
      if (!user) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, '登录已过期'),
          { status: 401 }
        )
      }

      // 将用户信息添加到请求对象
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user

      return handler(authenticatedReq)
    } catch (error) {
      console.error('认证中间件错误:', error)
      return NextResponse.json(
        createErrorResponse(ErrorCodes.SERVER_ERROR, '服务器内部错误'),
        { status: 500 }
      )
    }
  }
}

export function withErrorHandling(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API 错误:', error)
      return NextResponse.json(
        createErrorResponse(ErrorCodes.SERVER_ERROR, '服务器内部错误'),
        { status: 500 }
      )
    }
  }
} 