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