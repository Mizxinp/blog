# Next.js Standalone 模式部署指南

## 问题描述

在使用 Next.js `standalone` 模式进行部署时，可能会遇到样式丢失的问题。这是因为 Next.js 在 standalone 模式下不会自动复制静态资源文件。

## 原因分析

Next.js `standalone` 模式会生成一个独立的服务器文件，但是默认情况下：

1. ✅ 会复制 `server.js` 和必要的运行时文件
2. ✅ 会复制 `.next/server` 目录
3. ❌ **不会**复制 `.next/static` 目录（包含 CSS、JS、字体等静态资源）
4. ❌ **不会**复制 `public` 目录（包含图片、图标等公共资源）

## 解决方案

### 方法一：使用自动化脚本（推荐）

我们提供了一个自动化构建脚本：

```bash
# 运行自动化构建
pnpm run build:standalone

# 启动 standalone 服务器
pnpm run start:standalone
```

### 方法二：手动复制文件

如果你想手动处理，按以下步骤：

```bash
# 1. 正常构建
pnpm build

# 2. 复制静态文件
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 3. 启动服务器
cd .next/standalone && node server.js
```

### 方法三：Docker 部署

在 Dockerfile 中添加复制命令：

```dockerfile
# 复制构建结果
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 启动应用
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

## 验证部署

部署完成后，可以通过以下方式验证：

1. **检查服务器响应**：
   ```bash
   curl -I http://localhost:3000
   ```

2. **检查 CSS 文件**：
   ```bash
   curl -I http://localhost:3000/_next/static/css/[hash].css
   ```

3. **检查页面源码**：
   确保 `<link>` 标签中的 CSS 文件可以正常加载

## 文件结构

正确的 standalone 目录结构应该是：

```
.next/standalone/
├── .env                    # 环境变量
├── .next/
│   ├── static/            # ✅ 静态资源（CSS、JS、字体）
│   └── server/            # ✅ 服务端文件
├── public/                # ✅ 公共资源（图片、图标）
├── node_modules/          # ✅ 依赖包
├── package.json           # ✅ 包信息
├── server.js              # ✅ 服务器入口
└── src/                   # ✅ 源码（如果需要）
```

## 常见问题

### Q: 为什么样式会丢失？
A: 因为浏览器无法加载 `/_next/static/css/*.css` 文件，这些文件在 standalone 模式下默认不会被复制。

### Q: 字体文件也丢失了怎么办？
A: 字体文件也在 `.next/static` 目录中，按照上述方法复制即可解决。

### Q: 图片资源显示不了？
A: 确保 `public` 目录也被复制到了 standalone 目录中。

### Q: 可以自动化这个过程吗？
A: 可以，使用我们提供的 `build:standalone` 脚本，或者在 CI/CD 流程中添加文件复制步骤。

## 性能优化

1. **启用 Gzip 压缩**：在反向代理（如 Nginx）中启用 Gzip
2. **设置缓存头**：为静态资源设置长期缓存
3. **CDN 部署**：将静态资源部署到 CDN

## 相关链接

- [Next.js Standalone 文档](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files)
- [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 