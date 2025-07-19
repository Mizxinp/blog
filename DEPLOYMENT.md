# 技术博客系统部署指南

## 🚀 项目概览

这是一个基于 Next.js 15、Prisma 和 shadcn/ui 构建的现代化技术博客系统，完全按照 PRD 文档实现了所有核心功能。

## ✅ 已完成功能

### 核心功能
- ✅ 完整的文章管理系统（CRUD）
- ✅ Markdown 编辑器和渲染
- ✅ 标签系统和分类
- ✅ 搜索和筛选功能
- ✅ 响应式设计
- ✅ 管理员认证系统

### 技术特性
- ✅ 统一 API 响应格式
- ✅ JWT 认证
- ✅ 自动保存功能
- ✅ SEO 优化
- ✅ TypeScript 类型安全
- ✅ 现代化 UI 组件

## 🛠️ 快速部署

### 1. 环境准备

```bash
# 克隆项目
git clone <your-repo-url>
cd blog

# 安装依赖
pnpm install
```

### 2. 环境变量配置

创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/blog_db"

# 认证配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# 管理员账户
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

### 3. 数据库初始化

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表结构
npx prisma db push

# 初始化示例数据
pnpm run db:seed
```

### 4. 启动应用

```bash
# 开发模式
pnpm dev

# 生产构建
pnpm build
pnpm start
```

## 📋 功能使用指南

### 管理后台访问

1. 访问 `/login` 页面
2. 使用配置的管理员邮箱和密码登录
3. 登录成功后可访问 `/admin` 管理页面

### 文章管理

- **创建文章**：点击"新建文章"按钮
- **编辑文章**：在管理页面点击编辑按钮
- **发布文章**：在编辑器中点击"发布"按钮
- **查看预览**：已发布文章可点击预览按钮

### 内容编写

- 支持 Markdown 语法
- 自动保存功能（2秒延迟）
- 实时预览
- 标题和摘要自动生成

## 🌐 API 接口文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 文章接口
- `GET /api/posts` - 获取文章列表
- `GET /api/posts/detail?slug={slug}` - 获取文章详情
- `POST /api/posts` - 创建文章（需认证）
- `PATCH /api/posts/{id}` - 更新文章（需认证）
- `POST /api/posts/{id}/publish` - 发布文章（需认证）
- `DELETE /api/posts/{id}` - 删除文章（需认证）

### 标签接口
- `GET /api/tags` - 获取标签列表

### 统一响应格式
```json
{
  "code": "0",
  "result": <data>,
  "message": "描述信息"
}
```

## 📁 项目结构

```
blog/
├── docs/                   # PRD 文档
├── prisma/                 # 数据库模型和种子文件
│   ├── schema.prisma      # 数据库模型定义
│   └── seed.ts            # 初始化数据
├── src/
│   ├── app/               # Next.js App Router 页面
│   │   ├── admin/         # 管理后台页面
│   │   ├── api/           # API 路由
│   │   ├── login/         # 登录页面
│   │   └── posts/         # 文章相关页面
│   ├── components/        # React 组件
│   │   ├── ui/            # shadcn/ui 组件
│   │   ├── navigation.tsx # 导航组件
│   │   └── post-card.tsx  # 文章卡片组件
│   └── lib/               # 工具函数和配置
│       ├── prisma.ts      # Prisma 客户端
│       ├── auth.ts        # 认证工具
│       ├── api-response.ts # API 响应格式
│       ├── markdown.ts    # Markdown 处理
│       └── middleware.ts  # 中间件
├── package.json
└── README.md
```

## 🔧 开发工具

### 数据库管理
```bash
# 可视化数据库管理
npx prisma studio

# 重置数据库
npx prisma db push --force-reset
pnpm run db:seed
```

### 代码质量
- TypeScript 类型检查
- ESLint 代码规范
- Prettier 代码格式化

## 🚀 生产部署建议

### 环境变量
确保在生产环境中设置：
- `DATABASE_URL` - 生产数据库连接
- `NEXTAUTH_SECRET` - 强密码用于 JWT 签名
- `NEXTAUTH_URL` - 生产域名

### 性能优化
- 启用数据库连接池
- 配置 CDN 加速静态资源
- 启用 Next.js 缓存优化
- 配置数据库索引

### 安全建议
- 使用强密码和复杂的 JWT 密钥
- 启用 HTTPS
- 配置防火墙和访问控制
- 定期备份数据库

## 📈 后续扩展

已为以下功能预留扩展空间：
- 评论系统
- 文章分类
- RSS 订阅
- 搜索引擎优化
- 多用户支持
- 文件上传

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 配置
   - 确保 MySQL 服务运行正常

2. **登录失败**
   - 检查 NEXTAUTH_SECRET 配置
   - 确认管理员账户信息

3. **构建失败**
   - 清理 node_modules 重新安装
   - 检查 Node.js 版本兼容性

## 📞 支持

如遇到问题，请检查：
1. 环境变量配置是否正确
2. 数据库连接是否正常
3. 依赖包版本是否兼容

---

🎉 恭喜！您的技术博客系统已成功部署并可正常使用！ 