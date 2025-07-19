import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import matter from 'gray-matter'

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown)
  
  return result.toString()
}

export function extractSummary(content: string, length = 120): string {
  // 移除 Markdown 语法
  const plainText = content
    .replace(/#{1,6}\s+/g, '')      // 标题
    .replace(/\*\*(.*?)\*\*/g, '$1') // 粗体
    .replace(/\*(.*?)\*/g, '$1')     // 斜体
    .replace(/`(.*?)`/g, '$1')       // 行内代码
    .replace(/```[\s\S]*?```/g, '')  // 代码块
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // 图片
    .replace(/>\s*/g, '')            // 引用
    .replace(/[-*+]\s+/g, '')        // 列表
    .replace(/\d+\.\s+/g, '')        // 有序列表
    .replace(/\n+/g, ' ')            // 换行转空格
    .trim()

  return plainText.length > length ? plainText.slice(0, length) + '...' : plainText
}

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
} 