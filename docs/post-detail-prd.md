---
title: 文章详情 PRD（个人技术博客）
version: v0
owner: you
---

# 文章详情 PRD

目标：技术内容高可读、可分享、加载快；支持作者预览草稿，访客仅能看已发布内容。

---

## 1. 页面结构
1. 返回导航（← 首页 / 列表）
2. 标题（H1）
3. Meta 行：发布时间 / 更新日期（可选） / 标签
4. 正文（contentHtml 渲染；fallback contentMd）
5. 上一篇 / 下一篇（按 publishAt 排序）
6. 页脚：作者信息 / 返回顶部

---

## 2. 数据需求
渲染详情页需要：
```ts
type PostDetail = {
  id: number
  slug: string
  title: string
  summary?: string
  contentHtml?: string
  contentMd: string
  status: 'DRAFT' | 'PUBLISHED' | 'DELETED_SOFT'
  publishAt?: string
  updatedAt: string
  tags: { id:number; name:string; slug:string }[]
  coverUrl?: string | null
}
```

---

## 3. 接口
**GET** `/api/posts/{slug}`  
- 未发布 & 非作者：HTTP 404 + `code="4004"`。  
- 作者登录：可获取草稿（status=DRAFT）。

**响应示例（发布状态）：**
```json
{
  "code": "0",
  "result": {
    "id": 123,
    "slug": "react-performance",
    "title": "React 性能优化实践",
    "summary": "性能调优记录...",
    "contentHtml": "<h1>...</h1>",
    "contentMd": "# React...",
    "status": "PUBLISHED",
    "publishAt": "2025-07-17T14:05:00Z",
    "updatedAt": "2025-07-17T14:05:00Z",
    "tags": [{"id":1,"name":"React","slug":"react"}],
    "coverUrl": null
  },
  "message": ""
}
```

---

## 4. Markdown 渲染要求
- 使用 Tailwind Typography（`prose dark:prose-invert`）。
- 代码高亮：shiki / rehype-highlight。
- 内部标题生成锚点（H2/H3）。
- 表格横向滚动容器。
- 图片懒加载（`loading="lazy"`）。

---

## 5. TOC（P1）
桌面端显示侧边目录（H2/H3）；移动端折叠菜单按钮。

---

## 6. 状态 & 错误
| 状态 | 行为 | UI |
| --- | --- | --- |
| 未找到 | 返回 404 页面 | 「文章不存在或未发布」 |
| 草稿（作者） | 显示黄条提示「草稿预览」 + 编辑按钮 | 站长登录时可见 |
| 已删除软删 | 非作者：404；作者：提示已删除，可恢复（未来） |

---

## 7. SEO
- `<title>` = Post.title + 站点名
- `<meta name="description">` = summary 截断
- OG tags：title / description / image（coverUrl 或默认）
- Canonical URL：`/posts/{slug}`

---

## 8. 后续增强
- 文末“相关文章”（同标签）
- 评论（第三方，如 Giscus / Disqus）
- 阅读进度条
