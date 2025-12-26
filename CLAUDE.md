 # 项目背景

- 使用 TypeScript 和 nextjs 开发
- 兼容 React 19 版本
- nextjs 15.x版本
- node：20.x
- pnpm 8.x
- prisma
- mysql


# 编码规范

- 使用 TypeScript 和 React 书写
- ui组件：shadcn
- 样式：tailwind css
- 使用函数式组件和 hooks，避免类组件
- 使用提前返回（early returns）提高代码可读性
- 避免引入新依赖，严控打包体积
- 组件名使用大驼峰（PascalCase）
- 属性名使用小驼峰（camelCase）
- 合理使用 React.memo、useMemo 和 useCallback 优化性能
- prisma操作使用npx，比如npx prisma generate


# 样式规范

## 主题系统

项目使用 CSS 变量实现主题切换，支持日间模式（温暖文艺风）和暗黑模式（Neo Dark 科技风）。

### 主题切换机制

- 通过 `html` 元素的 `.dark` class 切换主题
- 使用 `localStorage` 持久化用户偏好
- 支持跟随系统主题（`system`）

### 核心 CSS 变量

在编写样式时，必须使用以下 CSS 变量而非硬编码颜色值：

```css
/* 基础颜色 */
--background      /* 页面背景色 */
--foreground      /* 主要文字色 */
--card            /* 卡片背景色 */
--card-foreground /* 卡片文字色 */

/* 强调色 */
--primary            /* 主题强调色（日间金色，暗黑霓虹绿） */
--primary-foreground /* 强调色上的文字 */
--accent-soft        /* 柔和强调背景 */
--accent-glow        /* 暗黑模式发光效果 */

/* 边框和分隔 */
--border          /* 边框颜色 */
--ring            /* 聚焦环颜色 */

/* 辅助色 */
--muted            /* 柔和背景 */
--muted-foreground /* 次要文字色 */
--destructive      /* 删除/危险操作色 */

/* 热力图 */
--heatmap-level-0 到 --heatmap-level-4
```

### Tailwind CSS 用法

使用语义化的 Tailwind 类名：

```jsx
// 推荐写法
<div className="bg-background text-foreground border-border">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
<span className="text-muted-foreground">
<div className="bg-card border border-border">

// 不推荐 - 避免硬编码颜色
<div className="bg-white text-gray-900">  // 错误
<button className="bg-blue-600">          // 错误
```

### 常用样式模式

#### 卡片悬停效果
```jsx
<Card className="border-border bg-card hover:shadow-lg dark:hover:shadow-[0_0_20px_var(--accent-glow)] transition-all">
```

#### 按钮样式
```jsx
// 主要按钮
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">

// 轮廓按钮
<Button variant="outline" className="border-border hover:border-primary hover:text-primary">

// 幽灵按钮
<Button variant="ghost" className="hover:text-primary hover:bg-accent-soft">

// 删除按钮
<Button className="text-destructive hover:text-destructive hover:bg-destructive/10">
```

#### 输入框样式
```jsx
<Input className="bg-card border-border focus:border-primary" />
```

#### 页面标题样式
```jsx
<p className="text-xs text-muted-foreground tracking-widest mb-2">— Section —</p>
<h1 className="text-3xl font-medium tracking-wide text-foreground">标 题 文 字</h1>
```

#### 左侧装饰线（悬停显示）
```jsx
<div className="relative overflow-hidden group">
  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
  {/* 内容 */}
</div>
```

### 添加新主题

1. 在 `src/app/globals.css` 中添加新的主题变量：
```css
.new-theme {
  --background: #xxx;
  --foreground: #xxx;
  /* ... 其他变量 */
}
```

2. 在 `src/hooks/useTheme.ts` 中添加主题类型和切换逻辑

3. 在 `src/components/theme-toggle.tsx` 中添加对应的切换选项