import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse } from '@/lib/api-response'
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware'

async function handleGetMe(req: AuthenticatedRequest) {
  return NextResponse.json(
    createSuccessResponse({
      user: req.user
    })
  )
}

export const GET = withAuth(handleGetMe) 