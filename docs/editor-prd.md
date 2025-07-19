---
title: 编辑器 / 草稿 / 发布 PRD（Notion风）
version: v0
owner: you
---

# 编辑器 / 草稿 / 发布 PRD（Notion 风即时格式化）

目标：提供所写即所见（WYSIWYG-ish）的块级编辑体验；兼容 Markdown 底层持久化；单作者使用；自动保存。

---

## 1. 核心原则
- **无双栏预览**：直接在主编辑区域即时格式化（类似 Notion / 飞书文档）。
- **快捷语法触发块**：`#`、`##`、`-`、`1.`、```、`>`、`/` 命令菜单。
- **自动保存**：输入停止 debounce 保存；守护定时保存；失败可重试。
- **Markdown 兼容**：块结构序列化为 Markdown 写库；渲染端可用 Markdown → HTML。
- **站长专用**：需登录；草稿仅站长可见。

---

## 2. Block 数据结构（前端）
```ts
type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'code'
  | 'quote'
  | 'bulleted-list'
  | 'numbered-list'
  | 'divider'
  | 'image';

interface BlockBase {
  id: string;
  type: BlockType;
}

interface TextBlock extends BlockBase {
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote';
  text: string;        // 富文本简化：行内 Markdown 标记（**bold** 等）
}

interface CodeBlock extends BlockBase {
  type: 'code';
  language?: string;
  code: string;
}

interface ListBlock extends BlockBase {
  type: 'bulleted-list' | 'numbered-list';
  items: string[];     // MVP 简化；后续可嵌套 Block[]
}

interface ImageBlock extends BlockBase {
  type: 'image';
  url: string;
  caption?: string;
}

type Block = TextBlock | CodeBlock | ListBlock | ImageBlock | {id:string;type:'divider'};
```

---

## 3. 页面布局
```
┌───────────────────────────────────────────────┐
│ 标题输入（大字号，可 inline 编辑）             │
├───────────────────────────────────────────────┤
│ [块编辑区域 - 所写即所见]                       │
│  - 输入 / 命令菜单                              │
│  - 块拖拽排序（P1）                              │
├───────────────────────────────────────────────┤
│ 右上角：保存状态 · 发布按钮 · 更多设置          │
└───────────────────────────────────────────────┘
```

---

## 4. 状态指示
| 状态 | 显示 | 触发 |
| --- | --- | --- |
| 正在保存 | 「正在保存…」 | debounce 保存发起 |
| 已保存 | 「已保存」(淡出) | 保存成功 |
| 保存失败 | 「保存失败，重试」Toast | API error (`code != 0`) |

---

## 5. 自动保存策略
- **输入停止 1.5s** → PATCH 保存。
- **守护定时 30s** → 强制保存。
- **本地兜底**：localStorage 临时缓存（postId-keyed）；恢复时提示合并（P1）。

---

## 6. 新建流程
```text
/ editor/new
  -> POST /api/posts {title:""}
  <- 返回 id, slug, status=DRAFT
  -> 跳转编辑器并聚焦标题
  -> 用户输入 (auto-save)
  -> 发布时填写标签/slug/封面 → publish
```

---

## 7. 编辑已发布文章流程
```text
/ editor/{id}
  -> GET /api/posts/{slug or id}
  -> 加载 contentMd; 解析为 BlockTree
  -> 用户修改
  -> PATCH 保存
  -> 发布（覆盖更新） -> 返回详情
```

---

## 8. 数据交互（API）

### 8.1 创建草稿
**POST** `/api/posts`
Request:
```json
{ "title": "" }
```
Response:
```json
{ "code":"0","result":{"id":123,"slug":"untitled-123","status":"DRAFT"},"message":"" }
```

---

### 8.2 更新草稿 / 已发布
**PATCH** `/api/posts/{id}`
```json
{
  "title": "React 性能优化实践",
  "contentMd": "# React...",
  "summary": "useMemo...",
  "tags": [1,2],
  "coverUrl": "https://example.com/cover.png"
}
```
Response:
```json
{ "code":"0","result":{"id":123,"updatedAt":"2025-07-17T14:02:00Z"},"message":"" }
```

---

### 8.3 发布
**POST** `/api/posts/{id}/publish`
```json
{ "publishAt": null }
```
Response:
```json
{ "code":"0","result":{"id":123,"slug":"react-performance","status":"PUBLISHED","publishAt":"2025-07-17T14:05:00Z"},"message":"" }
```

---

## 9. UI（shadcn/ui 建议实现）
| 功能 | 组件 | 说明 |
| --- | --- | --- |
| 标题输入 | `Input` 无边框大字号 / 自定义 | 自动聚焦 |
| 内容块 | 自定义富文本区域 | 基于 contentEditable |
| 命令菜单 | `Command` + `Popover` | `/` 调出 |
| 发布配置 | `Dialog` + 表单组件 | 标签、slug、封面 |
| Toast | `useToast()` | 保存状态反馈 |

---

## 10. 字段校验
- 标题必填（发布时）。
- slug 必须唯一、URL-safe（kebab-case）。
- 标签数建议 ≤ 5（软限制）。
- 内容非空（至少 1 块有效文字）。

---

## 11. 后续增强（Roadmap）
- 块拖拽排序
- Markdown/MDX 导入导出
- 图片上传自动图床
- 历史版本 / diff
- 多语言内容
