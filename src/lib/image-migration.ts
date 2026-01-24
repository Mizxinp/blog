import { isOwnOssUrl } from './constants'

export interface MigrationResult {
  originalUrl: string
  newUrl: string
  error?: string
}

/**
 * 从 HTML 内容中提取需要迁移的外部图片 URL
 */
export function extractExternalImageUrls(html: string): string[] {
  const urls: string[] = []

  // 匹配 HTML img 标签
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgTagRegex.exec(html)) !== null) {
    const url = match[1]
    if (url && !isOwnOssUrl(url) && url.startsWith('http')) {
      urls.push(url)
    }
  }

  // 匹配 Tiptap 转换后的 Markdown 图片格式: ![alt](<a href="url">url</a>)
  // 这种情况下 URL 在 <a> 标签的 href 中
  const mdInHtmlRegex = /!\[[^\]]*\]\(<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  while ((match = mdInHtmlRegex.exec(html)) !== null) {
    const url = match[1]
    if (url && !isOwnOssUrl(url) && url.startsWith('http')) {
      urls.push(url)
    }
  }

  return [...new Set(urls)] // 去重
}

/**
 * 从文本内容中提取 Markdown 格式的外部图片 URL
 * 格式: ![alt](url)
 */
export function extractMarkdownImageUrls(text: string): string[] {
  const urls: string[] = []

  // 匹配 Markdown 图片语法 ![alt](url)
  const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = mdImgRegex.exec(text)) !== null) {
    const url = match[1]
    if (url && !isOwnOssUrl(url) && url.startsWith('http')) {
      urls.push(url)
    }
  }

  return [...new Set(urls)] // 去重
}

/**
 * 检查文本是否包含外部图片（Markdown 或 HTML 格式）
 */
export function hasExternalImages(text: string): boolean {
  // 检查 Markdown 格式
  const mdImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/
  if (mdImgRegex.test(text)) {
    const match = text.match(mdImgRegex)
    if (match && !isOwnOssUrl(match[1])) {
      return true
    }
  }

  // 检查 HTML 格式
  const htmlImgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/
  if (htmlImgRegex.test(text)) {
    const match = text.match(htmlImgRegex)
    if (match && !isOwnOssUrl(match[1])) {
      return true
    }
  }

  return false
}

/**
 * 调用后端 API 迁移外部图片到自有 OSS
 */
export async function migrateImages(urls: string[]): Promise<MigrationResult[]> {
  if (urls.length === 0) return []

  const response = await fetch('/api/upload/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  })

  const data = await response.json()

  if (data.code !== '0') {
    throw new Error(data.message || 'Migration failed')
  }

  return data.result.migrations
}

/**
 * 替换内容中的图片 URL 并转换 Markdown 图片为 HTML img 标签
 */
export function replaceImageUrls(
  content: string,
  migrations: MigrationResult[]
): string {
  let result = content

  for (const { originalUrl, newUrl, error } of migrations) {
    // 跳过迁移失败的图片
    if (error) continue

    // 转义正则特殊字符
    const escaped = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // 1. 替换 Tiptap 转换后的 Markdown 图片格式为 <img> 标签
    // 格式: ![alt](<a href="url">url</a>)
    const mdInHtmlPattern = new RegExp(
      `!\\[([^\\]]*)\\]\\(<a[^>]+href=["']${escaped}["'][^>]*>[^<]*</a>\\)`,
      'g'
    )
    result = result.replace(mdInHtmlPattern, `<img src="${newUrl}" alt="$1">`)

    // 2. 替换普通的 URL（如果还有残留）
    result = result.replace(new RegExp(escaped, 'g'), newUrl)
  }

  return result
}

/**
 * 从内容中提取所有外部图片 URL（HTML + Markdown）
 */
export function extractAllExternalImageUrls(content: string): string[] {
  const htmlUrls = extractExternalImageUrls(content)
  const mdUrls = extractMarkdownImageUrls(content)
  return [...new Set([...htmlUrls, ...mdUrls])]
}
