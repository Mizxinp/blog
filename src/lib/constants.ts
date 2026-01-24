// 从环境变量获取 OSS 配置
export const OSS_DOMAIN = process.env.NEXT_PUBLIC_OSS_DOMAIN || ''
export const OSS_PATH_PREFIX = process.env.NEXT_PUBLIC_OSS_PATH_PREFIX || '/blog'

/**
 * 判断 URL 是否为自有 OSS 图片
 */
export function isOwnOssUrl(url: string): boolean {
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
