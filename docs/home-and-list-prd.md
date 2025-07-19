---
title: 首页 & 列表 PRD（个人技术博客）
version: v0
owner: you
---

# 首页 & 列表 PRD

目标：访客快速发现内容；站长写完即可自动展示。MVP 以发布时间倒序为主；无埋点、无推荐算法。

---

## 1. 首页信息架构
1. **顶部导航**：站点名、文章、关于（可选）、登录（仅作者）。
2. **Hero 区**（可选）：站点一句话描述；按钮 → 查看全部文章。
3. **最新文章**：最近 N 篇（默认 5）；字段：标题、发布日期、标签、摘要、封面缩略图。
4. **标签区**：按文章数排序展示常用标签（前 10 / 可滚动）。
5. **页脚**：版权、社交链接、RSS（未来）、备案（如需）。

---

## 2. 列表页 `/posts`
| 元素 | 说明 |
| --- | --- |
| 搜索框（q） | 标题 / 摘要 / 内容 LIKE（简版） |
| 标签筛选 | 单标签；点击标签 chip 即跳转带筛选参数 |
| 分页控件 | page / pageSize |
| 文章卡片 | 封面（可选）+ 标题 + 摘要 + 发布时间 + 标签 |

---

## 3. 空状态
- 访客：暂无文章。
- 站长登录：暂无文章，**按钮：写第一篇** → `/editor/new`。
- 标签筛选结果为空：提示清除筛选。

---

## 4. 列表卡片字段定义
| 字段 | 类型 | 来源 | 必须 | 说明 |
| --- | --- | --- | --- | --- |
| slug | string | Post.slug | 是 | 详情跳转 |
| title | string | Post.title | 是 | 标题 |
| summary | string | Post.summary | 否 | 无则从正文截取前 120 字符 |
| publishAt | Date | Post.publishAt | 已发布显示 | 发布时间 |
| tags | Tag[] | Post.tags | 否 | 多标签 |
| coverUrl | string | Post.coverUrl | 否 | 无时使用默认图 |

---

## 5. API
调用：**GET** `/api/posts`（详见 tech-architecture.md）。

前端列表页期望的 `result` 数据结构：
```json
{
  "items":[
    {
      "id":1,
      "slug":"hello-world",
      "title":"Hello World",
      "summary":"示例摘要...",
      "publishAt":"2025-07-01T00:00:00Z",
      "tags":[{"id":2,"name":"React","slug":"react"}],
      "coverUrl":null
    }
  ],
  "page":1,
  "pageSize":10,
      "total":27
}
```

---

## 6. 站长入口（仅登录可见）
- 顶部导航显示「写文章」按钮。
- 列表卡片 hover 显示「编辑」快捷入口。
- 列表顶部显示草稿数（可选）；点击进入草稿管理（未来版）。

---

## 7. UI 细化（shadcn/ui 建议）
- 搜索框：`<Input placeholder="搜索文章..." />`
- 标签筛选：顶部 `Badge` 列表，可滚动；选中态高亮。
- 分页：使用 `Pagination` 模式（shadcn 示例：上一页 / 页码 / 下一页）。

---

## 8. 路由行为
- `/posts?page=2&tag=react&q=next` → 服务器端检索（Server Component / fetch cache no-store）。
- 访问首页最新文章列表卡片点击 → `/posts/{slug}`.
