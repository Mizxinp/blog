---
title: UI / UX 指南（个人技术博客 · shadcn/ui）
version: v0
owner: you
---

# UI / UX 指南（shadcn/ui + Tailwind）

适用于个人技术博客：简洁、技术感、阅读友好、写作效率优先。

---

## 1. 视觉基调
- 内容区宽度：`max-w-prose`（约 65ch），正文走排版专注阅读；支持宽内容块（代码/表格）溢出滚动。
- 字号：正文 `text-base`; 文章标题 `text-3xl md:text-5xl`; 小字 meta `text-sm text-muted-foreground`.
- 行高：`leading-relaxed` / `leading-7`.
- 间距：段落 `mt-4`; 标题上方更大间距。
- 主题：light / dark 切换；基于 shadcn token。

---

## 2. 组件映射（功能 → shadcn）
| 功能 | 组件 | 说明 |
| --- | --- | --- |
| 顶部导航 | `NavigationMenu` or 自定义 flex + `Button` | 移动端折叠用 `Sheet` |
| 列表卡片 | `Card` 套件 | 标题、摘要、标签、发布时间、封面 |
| 标签 | `Badge` variant="secondary" | 可点击筛选 |
| 编辑器菜单 | `Menubar` + `DropdownMenu` + `Popover` | 支持命令 `/` 菜单 |
| 模态框 | `Dialog` | 发布确认、删除确认 |
| Toast | `useToast()` | 保存、发布状态反馈 |
| 表单域 | `Input`, `Textarea`, `Select`, `Combobox` | 标签选择、slug 编辑 |
| Loading | `Skeleton` | 列表 / 详情加载占位 |

---

## 3. 排版：文章正文
使用 Tailwind Typography 插件：
```tsx
<div className="prose dark:prose-invert max-w-none">
  {/* contentHtml 渲染 */}
</div>
```
- 链接 hover 下划线。
- 代码块：等宽字体（JetBrains Mono / Fira Code），`overflow-x-auto`.
- 图片：`my-6 mx-auto`; 可加 caption `text-center text-sm text-muted-foreground`.

---

## 4. Notion 风即时编辑体验
**交互原则：输入即格式化，无需预览栏。**

触发规则（示例）：
| 输入 | 转换为 | 行为 |
| --- | --- | --- |
| `#` + 空格 | H1 | 当前行转换块类型 |
| `##` + 空格 | H2 | 同上 |
| `-` + 空格 | Bulleted List |
| `1.` + 空格 | Numbered List |
| ``` + 回车 | Code Block（语言切换菜单） |
| `>` + 空格 | Quote |
| `/` | 命令菜单（插入块、图片、分割线等） |

块操作：
- 回车：新块（同类型或段落）。
- Backspace 行首：还原为段落。
- `Cmd/Ctrl + B/I/K`：加粗/斜体/插入链接（行内 Markdown 风）。

Auto-save 状态浮于右上角：**已保存 / 正在保存… / 保存失败**。

---

## 5. 响应式
- 移动端：顶部折叠菜单；列表纵向；编辑器全屏输入，工具栏底部浮层。
- 桌面端：导航横排；编辑器宽屏单栏；详情页可显示侧边 TOC（≥lg）。

---

## 6. 空状态文案
| 场景 | 文案 | 动作 |
| --- | --- | --- |
| 列表无内容（访客） | 「还没有文章」 | 无 |
| 列表无内容（站长） | 「还没有文章，去写第一篇吧」 | 按钮 → `/editor/new` |
| 标签筛选无结果 | 「该标签下暂时没有文章」 | 清除筛选 |

---

## 7. 可访问性（A11y）要点
- 所有交互组件具备 ARIA label。
- 颜色对比度 > WCAG AA。
- 键盘导航：焦点环可见。
- 图片需 alt 文本；封面无则空字符串，避免读屏器读 URL。

---

## 8. 国际化（暂不做自动切换）
- 站点初期中文；标题/正文作者自写。
- 若未来多语言，建议在 Post 表扩展 i18n 或多 Post 关联。

---

## 9. 后续增强
- 可折叠侧边大纲
- 暗色模式记忆
- 阅读进度条
- 字体切换（写作/阅读模式）
