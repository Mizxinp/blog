# 编辑器图片自动上传技术文档

**版本**：v1.0.0
**需求文档**：[editorPrd.md](../prds/editorPrd.md)
**创建时间**：2026-01-24

---

## 1. 需求概述

当用户在文章编辑器中粘贴包含图片的 Markdown 内容时，系统需要自动检测图片 URL 是否属于自有 OSS。如果不是，则自动下载图片并上传到自有 OSS，然后替换编辑器中的图片 URL。

### 1.1 核心流程

```
用户粘贴 MD 内容 → 检测图片 URL → 判断是否自有 OSS → 下载 → 上传 → 替换 URL
```

### 1.2 自有 OSS 域名

```
https://miz-pub-bucket.oss-cn-beijing.aliyuncs.com/blog
```

---

## 2. 现有代码分析

### 2.1 相关文件结构

```
src/
├── app/
│   ├── admin/editor/[id]/page.tsx          # 编辑器页面入口
│   └── api/upload/route.ts                  # 图片上传 API
├── components/
│   └── tiptap-templates/simple/
│       └── simple-editor.tsx                # SimpleEditor 组件
├── lib/
│   ├── tiptap-utils.ts                      # 包含 handleImageUpload 函数
│   └── oss.ts                               # OSS 上传服务
```

### 2.2 现有图片上传流程

**前端上传函数** (`src/lib/tiptap-utils.ts:256-332`)：
```typescript
export const handleImageUpload = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  // 通过 XMLHttpRequest 上传到 /api/upload
  // 返回上传后的 URL
}
```

**后端上传 API** (`src/app/api/upload/route.ts`)：
- 接收 FormData 中的文件
- 验证文件类型（image/jpeg, image/png, image/gif, image/webp, image/svg+xml）
- 验证文件大小（最大 5MB）
- 调用 `uploadToOSS` 上传到阿里云 OSS

**OSS 服务** (`src/lib/oss.ts`)：
- 使用 `ali-oss` SDK
- 生成唯一文件名：`blog/${timestamp}-${random}-${baseName}.${ext}`
- 上传后返回公共访问 URL

---

## 3. 技术方案

### 3.1 方案概述

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端                                    │
│  ┌───────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │ 监听 paste    │───>│ 提取外部图片 URL  │───>│ 调用迁移 API  │ │
│  │ 事件          │    │                  │    │               │ │
│  └───────────────┘    └──────────────────┘    └───────┬───────┘ │
└───────────────────────────────────────────────────────│─────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                           后端                                    │
│  ┌───────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │ 下载外部图片  │───>│ 上传到 OSS       │───>│ 返回新 URL    │ │
│  │               │    │                  │    │               │ │
│  └───────────────┘    └──────────────────┘    └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 自有 OSS 判断逻辑

```typescript
// src/lib/constants.ts (新建)

// 从环境变量获取 OSS 配置
export const OSS_DOMAIN = process.env.NEXT_PUBLIC_OSS_DOMAIN || ''
export const OSS_PATH_PREFIX = process.env.NEXT_PUBLIC_OSS_PATH_PREFIX || '/blog'

export function isOwnOssUrl(url: string): boolean {
  if (!OSS_DOMAIN) return false

  try {
    const parsed = new URL(url)
    return parsed.hostname === OSS_DOMAIN && parsed.pathname.startsWith(OSS_PATH_PREFIX)
  } catch {
    return false
  }
}
```

**环境变量配置** (`.env`)：
```bash
NEXT_PUBLIC_OSS_DOMAIN=miz-pub-bucket.oss-cn-beijing.aliyuncs.com
NEXT_PUBLIC_OSS_PATH_PREFIX=/blog
```

---

## 4. 实现细节

### 4.1 前端改动

#### 4.1.1 修改 SimpleEditor 组件

**文件**：`src/components/tiptap-templates/simple/simple-editor.tsx`

在编辑器配置中添加粘贴事件处理：

```typescript
import { isOwnOssUrl } from '@/lib/constants'
import { migrateExternalImages } from '@/lib/image-migration'

// 在 useEditor 的 editorProps 中添加 handlePaste
editorProps: {
  // ... 现有配置
  handlePaste: (view, event, slice) => {
    // 获取粘贴的 HTML 内容
    const html = event.clipboardData?.getData('text/html')
    if (!html) return false

    // 异步处理图片迁移
    handlePasteWithImageMigration(html, view, slice)

    return false // 让 tiptap 继续默认处理
  }
}
```

#### 4.1.2 创建图片迁移工具

**文件**：`src/lib/image-migration.ts` (新建)

```typescript
import { isOwnOssUrl } from './constants'

// 图片 URL 正则匹配
const IMG_URL_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g
const IMG_TAG_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi

interface MigrationResult {
  originalUrl: string
  newUrl: string
}

/**
 * 从内容中提取需要迁移的外部图片 URL
 */
export function extractExternalImageUrls(content: string): string[] {
  const urls: string[] = []

  // 匹配 Markdown 图片语法
  let match
  while ((match = IMG_URL_REGEX.exec(content)) !== null) {
    const url = match[2]
    if (!isOwnOssUrl(url)) {
      urls.push(url)
    }
  }

  // 匹配 HTML img 标签
  while ((match = IMG_TAG_REGEX.exec(content)) !== null) {
    const url = match[1]
    if (!isOwnOssUrl(url)) {
      urls.push(url)
    }
  }

  return [...new Set(urls)] // 去重
}

/**
 * 迁移外部图片到自有 OSS
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
 * 替换内容中的图片 URL
 */
export function replaceImageUrls(
  content: string,
  migrations: MigrationResult[]
): string {
  let result = content

  for (const { originalUrl, newUrl } of migrations) {
    // 转义正则特殊字符
    const escaped = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), newUrl)
  }

  return result
}
```

#### 4.1.3 编辑器内容更新逻辑

在 `SimpleEditor` 组件中添加处理函数：

```typescript
const handlePasteWithImageMigration = async (
  html: string,
  editor: Editor
) => {
  const urls = extractExternalImageUrls(html)

  if (urls.length === 0) return

  try {
    // 显示迁移中状态（可选）
    toast.loading('正在迁移外部图片...')

    const migrations = await migrateImages(urls)

    if (migrations.length > 0) {
      // 获取当前内容并替换 URL
      const currentHtml = editor.getHTML()
      const updatedHtml = replaceImageUrls(currentHtml, migrations)

      // 更新编辑器内容
      editor.commands.setContent(updatedHtml)

      toast.success(`已迁移 ${migrations.length} 张图片`)
    }
  } catch (error) {
    console.error('Image migration failed:', error)
    toast.error('图片迁移失败，请手动上传')
  }
}
```

### 4.2 后端改动

#### 4.2.1 创建图片迁移 API

**文件**：`src/app/api/upload/migrate/route.ts` (新建)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { isOwnOssUrl } from '@/lib/constants'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

interface MigrationResult {
  originalUrl: string
  newUrl: string
  error?: string
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
    if (urls.length > 10) {
      return NextResponse.json(
        createErrorResponse('4002', 'Maximum 10 images per request'),
        { status: 400 }
      )
    }

    const migrations: MigrationResult[] = []

    for (const url of urls) {
      // 跳过已经是自有 OSS 的图片
      if (isOwnOssUrl(url)) {
        continue
      }

      try {
        const result = await migrateImage(url)
        migrations.push(result)
      } catch (error) {
        migrations.push({
          originalUrl: url,
          newUrl: url, // 失败时保留原 URL
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
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

async function migrateImage(url: string): Promise<MigrationResult> {
  // 1. 下载图片
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BlogImageMigrator/1.0)'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }

  // 2. 验证 Content-Type
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.startsWith('image/')) {
    throw new Error('Invalid content type')
  }

  // 3. 获取图片数据
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 4. 验证文件大小
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('Image too large')
  }

  // 5. 生成文件名
  const fileName = extractFileName(url, contentType)

  // 6. 上传到 OSS
  const newUrl = await uploadToOSS(buffer, fileName)

  return {
    originalUrl: url,
    newUrl
  }
}

function extractFileName(url: string, contentType: string): string {
  try {
    const parsed = new URL(url)
    const pathParts = parsed.pathname.split('/')
    const originalName = pathParts[pathParts.length - 1] || 'image'

    // 确保有正确的扩展名
    const ext = contentType.split('/')[1] || 'jpg'
    if (!originalName.includes('.')) {
      return `${originalName}.${ext}`
    }

    return originalName
  } catch {
    return `image.${contentType.split('/')[1] || 'jpg'}`
  }
}
```

#### 4.2.2 更新常量文件

**文件**：`src/lib/constants.ts` (新建或更新)

```typescript
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
```

**环境变量** (`.env`)：
```bash
NEXT_PUBLIC_OSS_DOMAIN=miz-pub-bucket.oss-cn-beijing.aliyuncs.com
NEXT_PUBLIC_OSS_PATH_PREFIX=/blog
```

---

## 5. 边界情况处理

### 5.1 图片下载失败

- 保留原始 URL，不影响其他图片迁移
- 返回错误信息，前端可以提示用户手动处理

### 5.2 图片格式不支持

- 只支持常见图片格式：jpg, jpeg, png, gif, webp, svg
- 其他格式保留原始 URL

### 5.3 图片过大

- 超过 100MB 的图片跳过迁移，保留原始 URL
- 可考虑在后端进行压缩（后续优化）

### 5.4 网络超时

- 设置合理的下载超时时间（10 秒）
- 超时后保留原始 URL

### 5.5 并发控制

- 单次请求最多迁移 10 张图片
- 避免对外部服务器造成压力

---

## 6. 测试用例

### 6.1 单元测试

| 测试项 | 输入 | 预期输出 |
|--------|------|----------|
| 识别外部图片 | `![img](https://img.wemd.app/xxx.png)` | 返回该 URL |
| 识别自有图片 | `![img](https://miz-pub-bucket.oss-cn-beijing.aliyuncs.com/blog/xxx.png)` | 返回空数组 |
| 混合内容 | 包含自有和外部图片的内容 | 只返回外部图片 URL |
| URL 替换 | 原内容 + 迁移结果 | 正确替换后的内容 |

### 6.2 集成测试

| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 粘贴外部图片 MD | 粘贴包含外部图片的 MD | 图片自动迁移，URL 被替换 |
| 粘贴自有图片 MD | 粘贴包含自有 OSS 图片的 MD | 无迁移操作 |
| 粘贴纯文本 | 粘贴不包含图片的内容 | 正常粘贴，无额外操作 |
| 网络错误 | 外部图片无法访问 | 保留原 URL，显示提示 |

---

## 7. 文件变更清单

| 文件路径 | 变更类型 | 说明 |
|----------|----------|------|
| `src/lib/constants.ts` | 新增 | OSS 域名常量和判断函数 |
| `src/lib/image-migration.ts` | 新增 | 图片迁移工具函数 |
| `src/app/api/upload/migrate/route.ts` | 新增 | 图片迁移 API |
| `src/components/tiptap-templates/simple/simple-editor.tsx` | 修改 | 添加粘贴事件处理 |

---

## 8. 风险与注意事项

1. **跨域下载**：部分图片可能有防盗链，下载可能失败
2. **性能影响**：大量图片迁移可能导致编辑器短暂卡顿
3. **OSS 费用**：每次迁移都会产生 OSS 存储和流量费用
4. **重复迁移**：相同图片多次粘贴会产生多份副本（可后续优化去重）

---

## 9. 后续优化建议

1. **图片去重**：基于图片 hash 避免重复上传
2. **压缩处理**：大图片在上传前进行压缩
3. **进度显示**：多图片迁移时显示详细进度
4. **批量优化**：使用 Promise.allSettled 并行处理多张图片
5. **缓存机制**：缓存已迁移的 URL 映射关系
