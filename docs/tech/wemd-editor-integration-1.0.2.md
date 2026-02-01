# WeMD 编辑器集成技术文档

**版本**：v1.0.2
**需求文档**：[prd.md](../prds/prd.md)
**创建时间**：2026-01-24

---

## 1. 需求概述

将开源 Markdown 编辑器 WeMD 集成到当前博客项目中。WeMD 是一个专为微信公众号设计的现代化 Markdown 编辑器，支持实时预览、多主题切换、图片上传等功能。

### 1.1 迁移范围

- **只迁移**：`/WeMD/apps/web` 部分（编辑器前端）
- **不迁移**：`/WeMD/apps/electron`（桌面端）、`/WeMD/apps/server`（后端服务）
- **组件目录**：`/src/components/wemd-editor`（公共组件，可被其他页面复用）
- **页面路由**：`/src/app/editor`（编辑器独立页面入口）

### 1.2 核心目标

```
WeMD/apps/web → src/components/wemd-editor/   # 公共组件库
               ├── 编辑器核心组件
               ├── 预览组件
               ├── 主题系统
               ├── 状态管理
               └── 工具函数

             → src/app/editor/page.tsx        # 页面入口（引用组件）
```

### 1.3 设计原则

**组件化设计**：将编辑器作为独立的公共组件，便于在项目中复用：
- 文章编辑页面可以引入
- 独立编辑器页面可以引入
- 其他需要 Markdown 编辑的场景都可以使用

---

## 2. WeMD 项目分析

### 2.1 技术栈对比

| 技术点 | WeMD | 当前项目 | 兼容性 |
|--------|------|---------|--------|
| 框架 | React 18.3.1 | React 19 | 需要验证 |
| 构建工具 | Vite 6.0.5 | Next.js 15 | 需要适配 |
| 状态管理 | Zustand 5.0.8 | - | 可直接使用 |
| 样式 | CSS | Tailwind CSS | 需要整合 |
| 编辑器 | CodeMirror 6 | - | 新增依赖 |
| Markdown | markdown-it | - | 新增依赖 |
| 包管理 | pnpm 8.x | pnpm 8.x | 兼容 |

### 2.2 WeMD 核心模块结构

```
/WeMD/
├── apps/web/src/                    # 主要迁移目标
│   ├── components/
│   │   ├── Editor/                  # 编辑器核心 (10 文件, 1395 行)
│   │   ├── Preview/                 # 预览组件
│   │   ├── Theme/                   # 主题系统 (12 文件)
│   │   ├── Sidebar/                 # 文件侧边栏
│   │   ├── History/                 # 历史管理
│   │   ├── Header/                  # 顶部导航
│   │   ├── Settings/                # 设置面板
│   │   └── common/                  # 通用组件
│   ├── store/                       # Zustand 状态管理 (9 个 Store)
│   ├── services/                    # 图片上传服务
│   ├── hooks/                       # 自定义 Hooks
│   ├── utils/                       # 工具函数
│   ├── storage/                     # 存储适配器
│   ├── styles/                      # 全局样式
│   └── config/                      # 配置文件
└── packages/core/src/               # 核心 Markdown 处理库 (8778 行)
    ├── MarkdownParser.ts            # Markdown 解析器
    ├── ThemeProcessor.ts            # 主题处理器
    ├── plugins/                     # 12 个 markdown-it 插件
    └── themes/                      # 13 个预设主题
```

### 2.3 关键依赖清单

**必须新增的依赖**：

```json
{
  "dependencies": {
    "@codemirror/autocomplete": "^6.18.6",
    "@codemirror/commands": "^6.8.1",
    "@codemirror/lang-markdown": "^6.3.2",
    "@codemirror/language": "^6.11.0",
    "@codemirror/search": "^6.5.10",
    "@codemirror/state": "^6.5.2",
    "@codemirror/view": "^6.36.5",
    "@lezer/highlight": "^1.2.1",
    "codemirror": "^6.0.1",
    "markdown-it": "^14.1.0",
    "highlight.js": "^11.11.1",
    "mermaid": "^11.12.2",
    "katex": "^0.16.27",
    "zustand": "^5.0.8",
    "idb": "^8.0.2"
  },
  "devDependencies": {
    "@types/markdown-it": "^14.1.2",
    "@types/katex": "^0.16.7"
  }
}
```

---

## 3. 迁移架构设计

### 3.1 目标目录结构

```
src/
├── components/
│   └── wemd-editor/                 # 公共编辑器组件（核心）
│       ├── index.tsx                # 组件导出入口
│       ├── WeMDEditor.tsx           # 完整编辑器组件（编辑+预览+主题）
│       ├── components/
│       │   ├── MarkdownEditor/      # 编辑器核心
│       │   │   ├── index.tsx
│       │   │   ├── Toolbar.tsx
│       │   │   ├── SearchPanel.tsx
│       │   │   ├── editorShortcuts.ts
│       │   │   ├── markdownTheme.ts
│       │   │   └── styles.css
│       │   ├── Preview/             # 预览组件
│       │   │   ├── index.tsx
│       │   │   └── styles.css
│       │   ├── Theme/               # 主题系统
│       │   │   ├── ThemePanel.tsx
│       │   │   ├── ThemeDesigner/
│       │   │   └── styles.css
│       │   ├── History/             # 历史管理
│       │   │   ├── HistoryPanel.tsx
│       │   │   └── HistoryManager.tsx
│       │   └── common/              # 通用组件
│       │       ├── Modal.tsx
│       │       └── MobileToolbar.tsx
│       ├── store/                   # 状态管理
│       │   ├── editorStore.ts
│       │   ├── themeStore.ts
│       │   ├── historyStore.ts
│       │   └── settingsStore.ts
│       ├── services/                # 服务层
│       │   └── imageUploader.ts
│       ├── hooks/                   # 自定义 Hooks
│       │   ├── useStorage.ts
│       │   └── useUITheme.ts
│       ├── utils/                   # 工具函数
│       │   ├── katexRenderer.ts
│       │   ├── mermaidConfig.ts
│       │   └── wordCount.ts
│       ├── core/                    # 核心库 (从 packages/core 迁移)
│       │   ├── index.ts
│       │   ├── MarkdownParser.ts
│       │   ├── ThemeProcessor.ts
│       │   ├── plugins/
│       │   └── themes/
│       └── styles/
│           └── editor.css
│
└── app/
    └── editor/                      # 编辑器页面（引用公共组件）
        ├── page.tsx                 # 页面入口
        └── layout.tsx               # 布局配置
```

### 3.2 模块依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                    src/app/editor/page.tsx                       │
│                         (页面入口)                                │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               <WeMDEditor />  公共组件                      │  │
│  │            src/components/wemd-editor/                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                src/components/wemd-editor/                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │MarkdownEditor │    │   Preview        │    │  ThemePanel   │ │
│  │  + Toolbar    │    │                  │    │               │ │
│  │  + Search     │    │                  │    │               │ │
│  └───────┬───────┘    └────────┬─────────┘    └───────┬───────┘ │
│          │                     │                      │         │
│          ▼                     ▼                      ▼         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Zustand Stores                          │  │
│  │  editorStore  │  themeStore  │  historyStore  │  settings  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                               │                                 │
│                               ▼                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Core Library                          │  │
│  │  MarkdownParser  │  ThemeProcessor  │  Plugins  │  Themes  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

使用示例：
┌─────────────────────────────────────────────────────────────────┐
│  其他页面也可以引用：                                              │
│                                                                 │
│  // src/app/admin/editor/[id]/page.tsx (文章编辑)                │
│  import { WeMDEditor } from '@/components/wemd-editor'          │
│                                                                 │
│  // src/app/editor/page.tsx (独立编辑器)                         │
│  import { WeMDEditor } from '@/components/wemd-editor'          │
│                                                                 │
│  // 或只引入部分组件                                              │
│  import { MarkdownEditor, Preview } from '@/components/wemd-editor' │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 迁移步骤详解

### 4.1 第一阶段：基础设施

#### 4.1.1 安装依赖

```bash
# CodeMirror 相关
pnpm add @codemirror/autocomplete @codemirror/commands @codemirror/lang-markdown \
         @codemirror/language @codemirror/search @codemirror/state @codemirror/view \
         @lezer/highlight codemirror

# Markdown 处理
pnpm add markdown-it highlight.js

# 数学公式和图表
pnpm add mermaid katex

# 状态管理和存储
pnpm add zustand idb

# 类型定义
pnpm add -D @types/markdown-it @types/katex
```

#### 4.1.2 创建目录结构

```bash
# 创建公共组件目录
mkdir -p src/components/wemd-editor/{components,store,services,hooks,utils,core,styles}
mkdir -p src/components/wemd-editor/components/{MarkdownEditor,Preview,Theme,History,common}
mkdir -p src/components/wemd-editor/components/Theme/ThemeDesigner/sections
mkdir -p src/components/wemd-editor/core/{plugins,themes,utils}

# 创建页面目录
mkdir -p src/app/editor
```

### 4.2 第二阶段：核心库迁移

#### 4.2.1 迁移 packages/core

**源文件**：`/WeMD/packages/core/src/`

| 源路径 | 目标路径 | 说明 |
|--------|---------|------|
| `MarkdownParser.ts` | `src/components/wemd-editor/core/MarkdownParser.ts` | 核心解析器 |
| `ThemeProcessor.ts` | `src/components/wemd-editor/core/ThemeProcessor.ts` | 主题处理 |
| `plugins/*.ts` | `src/components/wemd-editor/core/plugins/` | 12 个插件 |
| `themes/*.ts` | `src/components/wemd-editor/core/themes/` | 13 个主题 |
| `utils/` | `src/components/wemd-editor/core/utils/` | 工具函数 |

**需要修改的导入路径**：

```typescript
// 原始（使用包别名）
import { createMarkdownParser } from '@wemd/core'

// 迁移后（使用路径别名）
import { createMarkdownParser } from '@/components/wemd-editor/core'

// 或组件内部使用相对路径
import { createMarkdownParser } from '../core/MarkdownParser'
```

#### 4.2.2 创建导出入口

**文件**：`src/components/wemd-editor/core/index.ts`

```typescript
export * from './MarkdownParser'
export * from './ThemeProcessor'
export * from './themes'
export { convertCssToWeChatDarkMode, convertToWeChatDarkMode } from './utils/darkMode'
```

### 4.3 第三阶段：状态管理迁移

#### 4.3.1 迁移 Store 文件

| 源文件 | 目标文件 | 核心功能 |
|--------|---------|---------|
| `editorStore.ts` | `src/components/wemd-editor/store/editorStore.ts` | markdown 内容管理 |
| `themeStore.ts` | `src/components/wemd-editor/store/themeStore.ts` | 主题管理 |
| `historyStore.ts` | `src/components/wemd-editor/store/historyStore.ts` | 版本历史 |
| `settingsStore.ts` | `src/components/wemd-editor/store/settingsStore.ts` | 用户设置 |
| `themes/builtInThemes.ts` | `src/components/wemd-editor/store/builtInThemes.ts` | 内置主题数据 |

#### 4.3.2 EditorStore 适配示例

**文件**：`src/components/wemd-editor/store/editorStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EditorState {
  markdown: string
  isEditing: boolean
  lastAutoSavedAt: Date | null
  currentFilePath: string | null

  // Actions
  setMarkdown: (content: string) => void
  setIsEditing: (value: boolean) => void
  updateLastAutoSaved: () => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      markdown: '',
      isEditing: false,
      lastAutoSavedAt: null,
      currentFilePath: null,

      setMarkdown: (content) => set({ markdown: content }),
      setIsEditing: (value) => set({ isEditing: value }),
      updateLastAutoSaved: () => set({ lastAutoSavedAt: new Date() }),
    }),
    {
      name: 'wemd-editor-storage',
    }
  )
)
```

### 4.4 第四阶段：组件迁移

#### 4.4.1 编辑器核心组件

**源路径**：`/WeMD/apps/web/src/components/Editor/`

**迁移清单**：

| 源文件 | 目标文件 | 代码行数 |
|--------|---------|---------|
| `MarkdownEditor.tsx` | `components/MarkdownEditor/index.tsx` | 292 |
| `Toolbar.tsx` | `components/MarkdownEditor/Toolbar.tsx` | ~200 |
| `SearchPanel.tsx` | `components/MarkdownEditor/SearchPanel.tsx` | ~150 |
| `editorShortcuts.ts` | `components/MarkdownEditor/editorShortcuts.ts` | ~100 |
| `markdownTheme.ts` | `components/MarkdownEditor/markdownTheme.ts` | ~80 |
| `ToolbarState.ts` | `components/MarkdownEditor/ToolbarState.ts` | ~50 |
| `*.css` | `components/MarkdownEditor/styles.css` | 合并 |

**关键修改点**：

```typescript
// 原始 - Vite 环境变量
const isElectron = import.meta.env.VITE_IS_ELECTRON

// 迁移后 - Next.js 环境变量（或直接移除 Electron 相关代码）
const isElectron = false  // Web 模式，不需要 Electron 功能
```

#### 4.4.2 预览组件

**文件**：`src/components/wemd-editor/components/Preview/index.tsx`

```typescript
'use client'

import { useEffect, useRef, useMemo } from 'react'
import { createMarkdownParser, processHtml } from '../../core'
import { useEditorStore } from '../../store/editorStore'
import { useThemeStore } from '../../store/themeStore'
import mermaid from 'mermaid'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './styles.css'

interface PreviewProps {
  className?: string
}

export function MarkdownPreview({ className }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { markdown } = useEditorStore()
  const { themeCSS, currentTheme } = useThemeStore()

  // 创建 Markdown 解析器
  const parser = useMemo(() => createMarkdownParser({
    highlight: true,
    math: true,
  }), [])

  // 解析 Markdown 并应用主题
  const htmlContent = useMemo(() => {
    const rawHtml = parser.render(markdown)
    return processHtml(rawHtml, themeCSS)
  }, [markdown, themeCSS, parser])

  // 渲染 Mermaid 图表
  useEffect(() => {
    if (!containerRef.current) return

    const mermaidElements = containerRef.current.querySelectorAll('.mermaid')
    if (mermaidElements.length > 0) {
      mermaid.init(undefined, mermaidElements)
    }
  }, [htmlContent])

  return (
    <div
      ref={containerRef}
      className={`preview-container ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
```

#### 4.4.3 主题系统

**迁移清单**：

| 源文件 | 目标文件 | 功能 |
|--------|---------|------|
| `ThemePanel.tsx` | `components/Theme/ThemePanel.tsx` | 主题选择面板 |
| `ThemeDesigner/` | `components/Theme/ThemeDesigner/` | 可视化主题设计器 |
| `ColorSelector.tsx` | `components/Theme/ColorSelector.tsx` | 颜色选择器 |
| `ThemeLivePreview.tsx` | `components/Theme/ThemeLivePreview.tsx` | 实时预览 |

**ThemeDesigner 子组件**：

```
ThemeDesigner/
├── index.tsx            # 主组件
├── generateCSS.ts       # CSS 生成器
└── sections/            # 样式分区
    ├── GlobalSection.tsx
    ├── HeadingSection.tsx
    ├── CodeSection.tsx
    ├── ListSection.tsx
    ├── TableHrSection.tsx
    ├── ImageSection.tsx
    ├── QuoteSection.tsx
    ├── ParagraphSection.tsx
    ├── MermaidSection.tsx
    └── OtherSection.tsx
```

### 4.5 第五阶段：组件导出与页面集成

#### 4.5.1 公共组件导出入口

**文件**：`src/components/wemd-editor/index.tsx`

```typescript
// 完整编辑器组件
export { WeMDEditor } from './WeMDEditor'
export type { WeMDEditorProps } from './WeMDEditor'

// 子组件（按需引入）
export { MarkdownEditor } from './components/MarkdownEditor'
export { MarkdownPreview } from './components/Preview'
export { ThemePanel } from './components/Theme/ThemePanel'
export { HistoryPanel } from './components/History/HistoryPanel'

// Store（外部页面可能需要访问状态）
export { useEditorStore } from './store/editorStore'
export { useThemeStore } from './store/themeStore'
export { useHistoryStore } from './store/historyStore'

// 核心库（外部可能需要直接使用）
export * from './core'
```

#### 4.5.2 完整编辑器组件

**文件**：`src/components/wemd-editor/WeMDEditor.tsx`

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { MarkdownEditor } from './components/MarkdownEditor'
import { MarkdownPreview } from './components/Preview'
import { ThemePanel } from './components/Theme/ThemePanel'
import { HistoryPanel } from './components/History/HistoryPanel'
import { useEditorStore } from './store/editorStore'
import { useThemeStore } from './store/themeStore'
import './styles/editor.css'

export interface WeMDEditorProps {
  /** 初始内容 */
  initialValue?: string
  /** 内容变化回调 */
  onChange?: (value: string) => void
  /** 保存回调 */
  onSave?: (value: string) => void
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示主题面板按钮 */
  showThemeButton?: boolean
  /** 是否显示历史面板按钮 */
  showHistoryButton?: boolean
  /** 视图模式 */
  defaultViewMode?: 'split' | 'editor' | 'preview'
  /** 自定义类名 */
  className?: string
  /** 高度 */
  height?: string | number
}

export function WeMDEditor({
  initialValue = '',
  onChange,
  onSave,
  showToolbar = true,
  showThemeButton = true,
  showHistoryButton = true,
  defaultViewMode = 'split',
  className = '',
  height = '100%',
}: WeMDEditorProps) {
  const [showThemePanel, setShowThemePanel] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [viewMode, setViewMode] = useState(defaultViewMode)

  const { markdown, setMarkdown } = useEditorStore()

  // 初始化内容
  useEffect(() => {
    if (initialValue) {
      setMarkdown(initialValue)
    }
  }, [initialValue, setMarkdown])

  // 内容变化回调
  const handleChange = useCallback((value: string) => {
    setMarkdown(value)
    onChange?.(value)
  }, [setMarkdown, onChange])

  // 保存快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.(markdown)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [markdown, onSave])

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={`wemd-editor-container flex flex-col bg-background ${className}`}
      style={containerStyle}
    >
      {/* 顶部工具栏 */}
      {showToolbar && (
        <header className="wemd-header border-b border-border px-4 h-12 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* 视图切换 */}
            <div className="flex rounded border border-border">
              {(['editor', 'split', 'preview'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 py-1 text-sm ${
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent-soft'
                  }`}
                >
                  {mode === 'editor' ? '编辑' : mode === 'preview' ? '预览' : '分屏'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showThemeButton && (
              <button
                onClick={() => setShowThemePanel(!showThemePanel)}
                className="px-3 py-1.5 rounded hover:bg-accent-soft text-sm"
              >
                主题
              </button>
            )}
            {showHistoryButton && (
              <button
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className="px-3 py-1.5 rounded hover:bg-accent-soft text-sm"
              >
                历史
              </button>
            )}
          </div>
        </header>
      )}

      {/* 主体区域 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 编辑器 */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className="flex-1 border-r border-border overflow-hidden">
            <MarkdownEditor
              value={markdown}
              onChange={handleChange}
            />
          </div>
        )}

        {/* 预览 */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="flex-1 overflow-auto">
            <MarkdownPreview />
          </div>
        )}

        {/* 主题面板 */}
        {showThemePanel && (
          <aside className="w-80 border-l border-border overflow-auto shrink-0">
            <ThemePanel onClose={() => setShowThemePanel(false)} />
          </aside>
        )}

        {/* 历史面板 */}
        {showHistoryPanel && (
          <aside className="w-80 border-l border-border overflow-auto shrink-0">
            <HistoryPanel onClose={() => setShowHistoryPanel(false)} />
          </aside>
        )}
      </main>
    </div>
  )
}
```

#### 4.5.3 编辑器页面入口（引用公共组件）

**文件**：`src/app/editor/page.tsx`

```typescript
'use client'

import { WeMDEditor } from '@/components/wemd-editor'
import { useCallback } from 'react'
import { toast } from 'sonner'

export default function EditorPage() {
  const handleSave = useCallback((content: string) => {
    // 保存到本地存储或调用 API
    localStorage.setItem('wemd-draft', content)
    toast.success('已保存')
  }, [])

  const handleChange = useCallback((content: string) => {
    // 可选：实时同步或防抖保存
    console.log('Content changed:', content.length, 'chars')
  }, [])

  return (
    <WeMDEditor
      initialValue={localStorage.getItem('wemd-draft') || ''}
      onChange={handleChange}
      onSave={handleSave}
      height="100vh"
    />
  )
}
```

#### 4.5.4 在其他页面中使用（示例）

**文件**：`src/app/admin/editor/[id]/page.tsx`（文章编辑页面）

```typescript
'use client'

import { WeMDEditor, useEditorStore } from '@/components/wemd-editor'
import { useEffect, useState } from 'react'

interface Props {
  params: Promise<{ id: string }>
}

export default function PostEditorPage({ params }: Props) {
  const [post, setPost] = useState<{ content: string } | null>(null)

  // 获取文章内容
  useEffect(() => {
    // fetch(`/api/posts/${id}`).then(...)
  }, [])

  const handleSave = async (content: string) => {
    // 调用文章保存 API
    // await fetch(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) })
  }

  if (!post) return <div>Loading...</div>

  return (
    <WeMDEditor
      initialValue={post.content}
      onSave={handleSave}
      showHistoryButton={false}  // 文章编辑可能不需要本地历史
      height="calc(100vh - 64px)"
    />
  )
}
```

#### 4.5.5 只使用预览组件（示例）

```typescript
import { MarkdownPreview, useEditorStore } from '@/components/wemd-editor'

function ArticlePreview({ content }: { content: string }) {
  const { setMarkdown } = useEditorStore()

  useEffect(() => {
    setMarkdown(content)
  }, [content, setMarkdown])

  return <MarkdownPreview className="prose max-w-none" />
}
```

#### 4.5.6 布局配置

**文件**：`src/app/editor/layout.tsx`

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WeMD Editor',
  description: '专为微信公众号设计的 Markdown 编辑器',
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="editor-layout">
      {children}
    </div>
  )
}
```

---

## 5. 适配修改清单

### 5.1 环境变量适配

| 原始 (Vite) | 迁移后 (Next.js) | 说明 |
|-------------|-----------------|------|
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` | 环境变量前缀 |
| `import.meta.env.DEV` | `process.env.NODE_ENV === 'development'` | 开发模式判断 |

### 5.2 路径别名适配

**更新 `tsconfig.json`**：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@wemd/*": ["./src/components/wemd-editor/*"]
    }
  }
}
```

**使用示例**：

```typescript
// 引入完整编辑器
import { WeMDEditor } from '@/components/wemd-editor'

// 引入子组件
import { MarkdownEditor, MarkdownPreview } from '@/components/wemd-editor'

// 引入 Store
import { useEditorStore, useThemeStore } from '@/components/wemd-editor'

// 组件内部使用别名
import { createMarkdownParser } from '@wemd/core'
```

### 5.3 移除 Electron 相关代码

需要移除或替换的代码模式：

```typescript
// 移除文件系统相关
// - useFileSystem.ts 中的 Electron IPC 调用
// - FileSystemAdapter.ts

// 移除窗口控制
// - useWindowControls.ts

// 移除 Electron 条件判断
// if (import.meta.env.VITE_IS_ELECTRON) { ... }
```

### 5.4 样式系统整合

**策略**：保留 WeMD 的 CSS 变量系统，与项目现有主题系统共存

**文件**：`src/components/wemd-editor/styles/editor.css`

```css
/* WeMD 编辑器专用样式 */
.wemd-editor-container {
  --editor-bg: var(--background);
  --editor-border: var(--border);
  --editor-text: var(--foreground);
}

/* 导入 WeMD 原始样式 */
@import '../components/MarkdownEditor/styles.css';
@import '../components/Preview/styles.css';
@import '../components/Theme/styles.css';
```

**样式隔离**：使用 `.wemd-` 前缀避免与项目其他样式冲突

---

## 6. 功能裁剪说明

### 6.1 保留功能

| 功能 | 说明 |
|------|------|
| Markdown 编辑 | CodeMirror 6 编辑器 |
| 实时预览 | markdown-it 渲染 |
| 语法高亮 | highlight.js |
| 数学公式 | KaTeX 渲染 |
| Mermaid 图表 | 图表渲染支持 |
| 主题系统 | 13 个预设主题 + 自定义 |
| 主题设计器 | 可视化主题配置 |
| 版本历史 | IndexedDB 本地存储 |
| 快捷键 | 常用编辑快捷键 |
| 搜索替换 | 编辑器内搜索 |

### 6.2 移除功能

| 功能 | 原因 |
|------|------|
| 文件系统管理 | 需要 Electron 环境 |
| 窗口控制 | 需要 Electron 环境 |
| 多云图片上传 | 使用项目现有 OSS 服务 |
| 微信复制服务 | 可后续按需添加 |
| 自动更新 | Electron 专属功能 |

### 6.3 需要适配的功能

| 功能 | 适配方案 |
|------|---------|
| 图片上传 | 对接项目现有 `/api/upload` |
| 文件保存 | 对接文章编辑 API |
| 主题持久化 | localStorage 或 Zustand persist |
| 用户设置 | localStorage 持久化 |

---

## 7. 图片上传适配

### 7.1 替换图片上传服务

**文件**：`src/components/wemd-editor/services/imageUploader.ts`

```typescript
import { handleImageUpload } from '@/lib/tiptap-utils'

export interface UploadResult {
  url: string
  error?: string
}

/**
 * 适配 WeMD 的图片上传接口
 * 使用项目现有的 OSS 上传服务
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    const url = await handleImageUpload(file)
    return { url }
  } catch (error) {
    return {
      url: '',
      error: error instanceof Error ? error.message : '上传失败'
    }
  }
}

/**
 * 处理粘贴的图片
 */
export async function handlePasteImage(
  clipboardData: DataTransfer
): Promise<UploadResult | null> {
  const items = clipboardData.items

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        return uploadImage(file)
      }
    }
  }

  return null
}
```

### 7.2 编辑器集成图片上传

修改 `MarkdownEditor` 组件，集成图片上传：

```typescript
// 在 MarkdownEditor 中添加粘贴处理
const handlePaste = useCallback(async (event: ClipboardEvent) => {
  const result = await handlePasteImage(event.clipboardData!)
  if (result && result.url) {
    // 插入 Markdown 图片语法
    const imageMarkdown = `![image](${result.url})`
    // 通过 CodeMirror API 插入
    insertText(imageMarkdown)
  }
}, [])
```

---

## 8. 文件迁移清单

> **目标根目录**：`src/components/wemd-editor/`

### 8.1 核心库 (packages/core → wemd-editor/core)

| 源路径 (WeMD/packages/core/src/) | 目标路径 (wemd-editor/) | 优先级 |
|--------|---------|--------|
| `MarkdownParser.ts` | `core/MarkdownParser.ts` | P0 |
| `ThemeProcessor.ts` | `core/ThemeProcessor.ts` | P0 |
| `plugins/*.ts` (12个) | `core/plugins/` | P0 |
| `themes/*.ts` (13个) | `core/themes/` | P0 |
| `utils/darkMode.ts` | `core/utils/darkMode.ts` | P1 |
| `utils/highlight.ts` | `core/utils/highlight.ts` | P1 |
| `index.ts` | `core/index.ts` | P0 |

### 8.2 状态管理 (apps/web/src/store → wemd-editor/store)

| 源路径 (WeMD/apps/web/src/) | 目标路径 (wemd-editor/) | 优先级 |
|--------|---------|--------|
| `store/editorStore.ts` | `store/editorStore.ts` | P0 |
| `store/themeStore.ts` | `store/themeStore.ts` | P0 |
| `store/historyStore.ts` | `store/historyStore.ts` | P1 |
| `store/settingsStore.ts` | `store/settingsStore.ts` | P1 |
| `store/themes/builtInThemes.ts` | `store/builtInThemes.ts` | P0 |

### 8.3 组件 (apps/web/src/components → wemd-editor/components)

| 源路径 (WeMD/apps/web/src/) | 目标路径 (wemd-editor/) | 优先级 |
|--------|---------|--------|
| `components/Editor/*` | `components/MarkdownEditor/` | P0 |
| `components/Preview/*` | `components/Preview/` | P0 |
| `components/Theme/*` | `components/Theme/` | P1 |
| `components/History/*` | `components/History/` | P1 |
| `components/common/*` | `components/common/` | P1 |

### 8.4 工具和服务 (apps/web/src → wemd-editor)

| 源路径 (WeMD/apps/web/src/) | 目标路径 (wemd-editor/) | 优先级 |
|--------|---------|--------|
| `utils/katexRenderer.ts` | `utils/katexRenderer.ts` | P0 |
| `utils/mermaidConfig.ts` | `utils/mermaidConfig.ts` | P0 |
| `utils/wordCount.ts` | `utils/wordCount.ts` | P2 |
| `hooks/useStorage.ts` | `hooks/useStorage.ts` | P1 |
| `hooks/useUITheme.ts` | `hooks/useUITheme.ts` | P1 |
| `storage/IndexedDBAdapter.ts` | `storage/IndexedDBAdapter.ts` | P1 |

### 8.5 样式文件 (apps/web/src → wemd-editor)

| 源路径 (WeMD/apps/web/src/) | 目标路径 (wemd-editor/) | 优先级 |
|--------|---------|--------|
| `styles/global.css` | `styles/editor.css` | P0 |
| `components/Editor/*.css` | `components/MarkdownEditor/styles.css` | P0 |
| `components/Preview/*.css` | `components/Preview/styles.css` | P0 |
| `components/Theme/*.css` | `components/Theme/styles.css` | P1 |

### 8.6 新增文件

| 文件路径 | 说明 | 优先级 |
|--------|------|--------|
| `src/components/wemd-editor/index.tsx` | 公共组件导出入口 | P0 |
| `src/components/wemd-editor/WeMDEditor.tsx` | 完整编辑器组件 | P0 |
| `src/app/editor/page.tsx` | 独立编辑器页面 | P0 |
| `src/app/editor/layout.tsx` | 页面布局 | P0 |

---

## 9. 测试计划

### 9.1 功能测试

| 测试项 | 测试内容 | 预期结果 |
|--------|---------|---------|
| 编辑器加载 | 访问 /editor | 编辑器正常渲染 |
| Markdown 输入 | 输入 Markdown 文本 | 实时显示在编辑器 |
| 实时预览 | 输入内容 | 右侧预览实时更新 |
| 语法高亮 | 输入代码块 | 代码正确高亮 |
| 数学公式 | 输入 LaTeX | KaTeX 正确渲染 |
| Mermaid 图表 | 输入 Mermaid 语法 | 图表正确渲染 |
| 主题切换 | 选择不同主题 | 预览样式变化 |
| 图片上传 | 粘贴/拖拽图片 | 图片上传并插入 |
| 快捷键 | Cmd+S 等 | 正确响应 |
| 历史记录 | 自动保存 | 可恢复历史版本 |

### 9.2 兼容性测试

| 测试环境 | 测试浏览器 |
|---------|-----------|
| macOS | Chrome, Safari, Firefox |
| Windows | Chrome, Edge, Firefox |
| 移动端 | iOS Safari, Android Chrome |

### 9.3 性能测试

| 测试项 | 指标 |
|--------|------|
| 首次加载 | < 3s |
| 输入响应 | < 50ms |
| 预览更新 | < 100ms |
| 大文档编辑 (>10000字) | 流畅无卡顿 |

---

## 10. 实施计划

### Phase 1: 基础框架 (P0)

1. 安装依赖包
2. 创建 `src/components/wemd-editor/` 目录结构
3. 迁移核心库到 `wemd-editor/core/`
4. 迁移编辑器和预览组件到 `wemd-editor/components/`
5. 创建 `WeMDEditor.tsx` 完整组件
6. 创建 `index.tsx` 导出入口
7. 创建 `src/app/editor/page.tsx` 页面引用组件

**验收标准**：
- 编辑器可以正常输入 Markdown 并实时预览
- 可以在 `/editor` 路由访问独立编辑器
- 可以从 `@/components/wemd-editor` 导入组件

### Phase 2: 主题系统 (P1)

1. 迁移 themeStore 到 `wemd-editor/store/`
2. 迁移 ThemePanel 组件
3. 迁移 ThemeDesigner 组件
4. 集成 13 个预设主题

**验收标准**：可以切换主题，预览样式正确变化

### Phase 3: 历史管理 (P1)

1. 迁移 historyStore
2. 迁移 IndexedDB 适配器
3. 迁移 HistoryPanel 组件
4. 实现自动保存

**验收标准**：内容自动保存，可以查看和恢复历史版本

### Phase 4: 功能完善 (P2)

1. 适配图片上传（对接项目 OSS）
2. 完善快捷键支持
3. 添加搜索替换功能
4. 样式优化和主题整合
5. 测试在其他页面引用组件

**验收标准**：
- 所有核心功能正常工作
- 可以在文章编辑页面引用编辑器组件

### Phase 5: 测试和优化

1. 功能测试
2. 兼容性测试
3. 性能优化（按需加载、代码分割）
4. 文档完善

**验收标准**：通过所有测试用例

---

## 11. 风险与注意事项

### 11.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| React 19 兼容性 | 组件可能不兼容 | 逐步测试，必要时降级依赖 |
| CodeMirror 包体积大 | 首屏加载慢 | 动态导入，代码分割 |
| CSS 冲突 | 样式错乱 | 使用 CSS Modules 或命名空间 |
| Zustand 版本 | 状态管理问题 | 锁定版本，测试兼容性 |

### 11.2 注意事项

1. **保持原始代码结构**：尽量保持 WeMD 的代码结构，便于后续同步上游更新
2. **渐进式迁移**：按优先级分阶段迁移，每个阶段验收后再进行下一阶段
3. **充分测试**：每个功能模块迁移后都要进行完整测试
4. **文档同步**：迁移过程中同步更新文档，记录修改点
5. **公共组件设计原则**：
   - 组件 Props 设计要通用，支持常见使用场景
   - Store 状态要支持多实例（如果需要在同一页面使用多个编辑器）
   - 样式使用命名空间隔离，避免与项目其他样式冲突
   - 导出入口清晰，支持按需导入子组件

---

## 12. 后续优化建议

1. **按需加载**：将 Mermaid、KaTeX 等库改为按需加载
2. **Service Worker**：添加 PWA 支持，实现离线编辑
3. **协同编辑**：基于 WebSocket 实现多人协同
4. **插件系统**：设计插件架构，支持功能扩展
5. **导出功能**：支持导出为 PDF、HTML、微信格式
6. **云同步**：对接云存储，实现跨设备同步
