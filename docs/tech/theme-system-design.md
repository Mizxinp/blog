# 博客主题系统技术方案

## 1. 概述

### 1.1 背景
当前博客使用默认的灰度配色，视觉风格不够突出。用户选择了两套主题：
- **日常模式**：温暖文艺风（米色调、衬线字体、金色强调）
- **暗黑模式**：Neo Dark 科技风（深色背景、等宽字体、绿色强调）

### 1.2 目标
1. 建立可扩展的主题系统，支持多主题切换
2. 将所有页面改为新配色
3. 功能保持不变
4. 更新编码规范，方便后续开发

### 1.3 设计原则
- **可扩展性**：添加新主题只需新增一个 CSS 文件
- **一致性**：所有颜色通过 CSS 变量引用
- **兼容性**：与现有 Tailwind CSS 和 Shadcn 组件兼容
- **性能**：无额外 JS 开销，纯 CSS 切换

---

## 2. 主题配色方案

### 2.1 温暖文艺风（Warm Literary）- 日常模式

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--background` | `#FDF8F3` | 页面主背景 |
| `--foreground` | `#2D2A26` | 主要文字 |
| `--card` | `#FFFFFF` | 卡片背景 |
| `--card-foreground` | `#2D2A26` | 卡片文字 |
| `--muted` | `#F5EDE4` | 次级背景 |
| `--muted-foreground` | `#9A958D` | 次级文字 |
| `--accent` | `#B8860B` | 强调色（金色） |
| `--accent-foreground` | `#FFFFFF` | 强调色上的文字 |
| `--border` | `#E5DDD3` | 边框 |
| `--primary` | `#B8860B` | 主要交互色 |
| `--secondary` | `#F5EDE4` | 次要交互色 |

**字体方案**：
- 标题/正文：`'Noto Serif SC', Georgia, serif`
- 代码：`'Menlo', 'JetBrains Mono', monospace`

**设计特点**：
- 圆角：`4px`（小圆角，典雅感）
- 阴影：柔和的暖色阴影 `rgba(45, 42, 38, 0.06)`
- 装饰：分隔线、首字下沉

---

### 2.2 Neo Dark 科技风（Dark Tech）- 暗黑模式

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--background` | `#0A0A0C` | 页面主背景 |
| `--foreground` | `#E0E0E0` | 主要文字 |
| `--card` | `#141416` | 卡片背景 |
| `--card-foreground` | `#E0E0E0` | 卡片文字 |
| `--muted` | `#1A1A1E` | 次级背景 |
| `--muted-foreground` | `#888888` | 次级文字 |
| `--accent` | `#00FF9D` | 强调色（霓虹绿） |
| `--accent-foreground` | `#0A0A0C` | 强调色上的文字 |
| `--border` | `#333333` | 边框 |
| `--primary` | `#00FF9D` | 主要交互色 |
| `--secondary` | `#1A1A1E` | 次要交互色 |

**字体方案**：
- 标题/导航：`'JetBrains Mono', monospace`
- 正文：`'Inter', sans-serif`

**设计特点**：
- 圆角：`0px`（直角，科技感）
- 阴影：深色阴影 + 霓虹发光 `0 0 8px rgba(0, 255, 157, 0.2)`
- 装饰：闪烁光标、虚线边框

---

## 3. 技术架构

### 3.1 文件结构

```
src/
├── styles/
│   ├── themes/
│   │   ├── _theme-base.scss       # 主题基础变量定义
│   │   ├── _theme-warm.scss       # 温暖文艺风配色
│   │   └── _theme-dark.scss       # Neo Dark 配色
│   ├── _variables.scss            # 保留（兼容）
│   └── _keyframe-animations.scss  # 保留
├── app/
│   └── globals.css                # 导入主题文件
├── lib/
│   └── theme.ts                   # 主题切换工具函数
├── components/
│   └── theme-toggle.tsx           # 主题切换组件
└── hooks/
    └── useTheme.ts                # 主题 Hook
```

### 3.2 主题变量层级

```
:root                    # 默认主题（温暖文艺风）
  ├── --background
  ├── --foreground
  ├── --card
  ├── --accent
  └── ...

.dark                    # 暗黑模式（Neo Dark）
  ├── --background
  ├── --foreground
  └── ...

[data-theme="custom"]    # 未来扩展的自定义主题
  └── ...
```

### 3.3 主题切换机制

```typescript
// lib/theme.ts
export type Theme = 'light' | 'dark' | 'system';

export function setTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }

  localStorage.setItem('theme', theme);
}

export function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'system';
}
```

---

## 4. 实施步骤

### 4.1 第一阶段：主题基础设施（预计改动文件 3-4 个）

1. **创建主题文件**
   - 新建 `src/styles/themes/_theme-warm.scss`
   - 新建 `src/styles/themes/_theme-dark.scss`

2. **修改 globals.css**
   - 替换 `:root` 中的变量为温暖文艺风配色
   - 替换 `.dark` 中的变量为 Neo Dark 配色
   - 添加字体定义

3. **创建主题工具**
   - 新建 `src/lib/theme.ts`
   - 新建 `src/hooks/useTheme.ts`

4. **添加主题切换组件**
   - 新建 `src/components/theme-toggle.tsx`
   - 集成到 Navigation 组件

### 4.2 第二阶段：页面适配（预计改动文件 10-15 个）

需要适配的页面：

| 页面 | 文件路径 | 改动点 |
|------|----------|--------|
| 首页 | `src/app/page.tsx` | 配色、字体 |
| 文章列表 | `src/app/posts/page.tsx` | 配色、卡片样式 |
| 文章详情 | `src/app/posts/[slug]/page.tsx` | 配色、排版 |
| 登录页 | `src/app/login/page.tsx` | 配色 |
| 管理后台 | `src/app/admin/page.tsx` | 配色 |
| 文章管理 | `src/app/admin/posts/page.tsx` | 配色 |
| 标签管理 | `src/app/admin/tags/page.tsx` | 配色 |
| 编辑器 | `src/app/admin/editor/[id]/page.tsx` | 配色 |
| 404 页面 | `src/app/not-found.tsx` | 配色 |

需要适配的组件：

| 组件 | 文件路径 | 改动点 |
|------|----------|--------|
| 导航栏 | `src/components/navigation.tsx` | 样式、交互 |
| 文章卡片 | `src/components/post-card.tsx` | 卡片样式 |
| 热力图 | `src/components/contribution-heatmap.tsx` | 颜色等级 |
| 标签选择器 | `src/components/tag-selector.tsx` | 配色 |

### 4.3 第三阶段：细节优化

1. 调整 Shadcn 组件配色
2. 代码块语法高亮适配
3. 过渡动画优化
4. 响应式检查

---

## 5. 代码示例

### 5.1 globals.css 主题变量（最终版本）

```css
@import "tailwindcss";
@import "tw-animate-css";
@import '../styles/_variables.scss';
@import '../styles/_keyframe-animations.scss';

@custom-variant dark (&:is(.dark *));

/* 温暖文艺风 - 日常模式 */
:root {
  --radius: 4px;

  /* 背景色 */
  --background: #FDF8F3;
  --foreground: #2D2A26;

  /* 卡片 */
  --card: #FFFFFF;
  --card-foreground: #2D2A26;

  /* 弹窗 */
  --popover: #FFFFFF;
  --popover-foreground: #2D2A26;

  /* 主色 */
  --primary: #B8860B;
  --primary-foreground: #FFFFFF;

  /* 次要 */
  --secondary: #F5EDE4;
  --secondary-foreground: #2D2A26;

  /* 静音 */
  --muted: #F5EDE4;
  --muted-foreground: #9A958D;

  /* 强调 */
  --accent: #B8860B;
  --accent-foreground: #FFFFFF;
  --accent-soft: #F5E6C8;

  /* 破坏性 */
  --destructive: #DC2626;

  /* 边框 */
  --border: #E5DDD3;
  --input: #E5DDD3;
  --ring: #B8860B;

  /* 热力图 */
  --heatmap-level-0: #F5EDE4;
  --heatmap-level-1: #F5E6C8;
  --heatmap-level-2: #E8D4A8;
  --heatmap-level-3: #D4A853;
  --heatmap-level-4: #B8860B;

  /* 字体 */
  --font-serif: 'Noto Serif SC', Georgia, serif;
  --font-mono: 'Menlo', 'JetBrains Mono', monospace;
}

/* Neo Dark 科技风 - 暗黑模式 */
.dark {
  --radius: 0px;

  /* 背景色 */
  --background: #0A0A0C;
  --foreground: #E0E0E0;

  /* 卡片 */
  --card: #141416;
  --card-foreground: #E0E0E0;

  /* 弹窗 */
  --popover: #141416;
  --popover-foreground: #E0E0E0;

  /* 主色 */
  --primary: #00FF9D;
  --primary-foreground: #0A0A0C;

  /* 次要 */
  --secondary: #1A1A1E;
  --secondary-foreground: #E0E0E0;

  /* 静音 */
  --muted: #1A1A1E;
  --muted-foreground: #888888;

  /* 强调 */
  --accent: #00FF9D;
  --accent-foreground: #0A0A0C;
  --accent-glow: rgba(0, 255, 157, 0.2);

  /* 破坏性 */
  --destructive: #FF4444;

  /* 边框 */
  --border: #333333;
  --input: #333333;
  --ring: #00FF9D;

  /* 热力图 */
  --heatmap-level-0: #1A1A1E;
  --heatmap-level-1: rgba(0, 255, 157, 0.15);
  --heatmap-level-2: rgba(0, 255, 157, 0.35);
  --heatmap-level-3: rgba(0, 255, 157, 0.55);
  --heatmap-level-4: #00FF9D;

  /* 字体 */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 5.2 主题切换 Hook

```typescript
// src/hooks/useTheme.ts
'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let isDark: boolean;
      if (theme === 'system') {
        isDark = mediaQuery.matches;
      } else {
        isDark = theme === 'dark';
      }

      root.classList.toggle('dark', isDark);
      setResolvedTheme(isDark ? 'dark' : 'light');
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return { theme, resolvedTheme, setTheme };
}
```

### 5.3 主题切换组件

```tsx
// src/components/theme-toggle.tsx
'use client';

import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme}>
      {theme === 'light' && <Sun className="h-5 w-5" />}
      {theme === 'dark' && <Moon className="h-5 w-5" />}
      {theme === 'system' && <Monitor className="h-5 w-5" />}
    </Button>
  );
}
```

---

## 6. CLAUDE.md 样式规范更新

在 CLAUDE.md 中新增以下内容：

```markdown
# 样式规范

## 主题系统

- 项目使用双主题系统：日常模式（温暖文艺风）和暗黑模式（Neo Dark）
- 所有颜色必须通过 CSS 变量引用，禁止硬编码颜色值
- 主题相关变量定义在 `globals.css` 中

## 颜色使用规范

| 用途 | Tailwind 类名 | CSS 变量 |
|------|--------------|----------|
| 页面背景 | `bg-background` | `var(--background)` |
| 主要文字 | `text-foreground` | `var(--foreground)` |
| 卡片背景 | `bg-card` | `var(--card)` |
| 次级背景 | `bg-muted` | `var(--muted)` |
| 次级文字 | `text-muted-foreground` | `var(--muted-foreground)` |
| 强调色 | `text-accent` / `bg-accent` | `var(--accent)` |
| 边框 | `border-border` | `var(--border)` |
| 主按钮 | `bg-primary text-primary-foreground` | - |

## 字体使用规范

- 日常模式使用衬线字体 `font-serif`
- 暗黑模式标题使用等宽字体 `font-mono`
- 代码块统一使用 `font-mono`

## 组件样式规范

1. **卡片组件**
   - 使用 `bg-card` 背景
   - 边框使用 `border border-border`
   - 圆角跟随主题 `rounded-[var(--radius)]`

2. **按钮组件**
   - 主按钮：`bg-primary text-primary-foreground`
   - 次按钮：`bg-secondary text-secondary-foreground`
   - 幽灵按钮：`hover:bg-accent hover:text-accent-foreground`

3. **输入框**
   - 边框：`border-input`
   - 聚焦：`focus:ring-ring`

4. **标签组件**
   - 背景：`bg-muted`
   - 文字：`text-muted-foreground`
   - 悬停：`hover:bg-accent hover:text-accent-foreground`

## 暗黑模式适配

- 使用 `dark:` 前缀处理差异化样式
- 优先使用语义化变量，减少 `dark:` 使用
- 发光效果仅在暗黑模式启用：`dark:shadow-[0_0_8px_var(--accent-glow)]`

## 添加新主题

1. 在 `globals.css` 中新增主题类（如 `.theme-custom`）
2. 定义该主题的所有 CSS 变量
3. 更新 `useTheme` Hook 支持新主题
4. 更新 `ThemeToggle` 组件
```

---

## 7. 风险与注意事项

### 7.1 兼容性风险
- Shadcn 组件依赖特定变量名，需保持变量命名一致
- 部分第三方组件可能不支持 CSS 变量

### 7.2 性能考虑
- CSS 变量切换无 JS 开销
- 字体加载可能影响首屏，建议使用 `font-display: swap`

### 7.3 测试要点
- 所有页面在两种主题下的视觉效果
- 主题切换的平滑过渡
- 系统主题跟随功能
- LocalStorage 持久化

---

## 8. 验收标准

1. [ ] 日常模式使用温暖文艺风配色
2. [ ] 暗黑模式使用 Neo Dark 配色
3. [ ] 主题切换按钮正常工作
4. [ ] 所有页面在两种主题下显示正确
5. [ ] 主题选择可持久化
6. [ ] 支持跟随系统主题
7. [ ] CLAUDE.md 更新完成
8. [ ] 无功能性回归

---

## 9. 附录

### 9.1 参考设计稿
- 日常模式：`docs/theme/plan-b/03-warm-literary.html`
- 暗黑模式：`docs/theme/pan-a/variant-b.html`

### 9.2 颜色对照表

| 场景 | 日常模式 | 暗黑模式 |
|------|----------|----------|
| 背景 | `#FDF8F3` | `#0A0A0C` |
| 文字 | `#2D2A26` | `#E0E0E0` |
| 卡片 | `#FFFFFF` | `#141416` |
| 边框 | `#E5DDD3` | `#333333` |
| 强调 | `#B8860B` 金色 | `#00FF9D` 霓虹绿 |
| 次级文字 | `#9A958D` | `#888888` |
