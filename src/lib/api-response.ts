export interface ApiResponse<T = unknown> {
  code: string
  result: T | null
  message: string
}

export function createSuccessResponse<T>(result: T, message = ''): ApiResponse<T> {
  return {
    code: '0',
    result,
    message
  }
}

export function createErrorResponse(code: string, message: string): ApiResponse<null> {
  return {
    code,
    result: null,
    message
  }
}

export const ErrorCodes = {
  SUCCESS: '0',
  PARAM_ERROR: '1001',
  UNAUTHORIZED: '2001',
  FORBIDDEN: '2003',
  NOT_FOUND: '4004',
  SERVER_ERROR: '5000'
} as const 