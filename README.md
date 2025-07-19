# 技术博客系统

一个基于 Next.js、Prisma 和 shadcn/ui 构建的现代化技术博客系统。

## 特性

- 📝 **Markdown 编辑器** - 支持实时预览和自动保存
- 🎨 **现代化 UI** - 基于 shadcn/ui 的美观界面
- 🔍 **搜索功能** - 支持文章标题、内容搜索
- 🏷️ **标签系统** - 灵活的内容分类管理
- 📱 **响应式设计** - 完美适配各种设备
- 🌙 **暗黑模式** - 支持亮色/暗色主题切换
- 🔐 **简单认证** - 单用户管理系统

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **数据库**: MySQL + Prisma ORM
- **Markdown**: remark + rehype
- **认证**: 自定义 JWT 认证

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd blog
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/blog_db"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 管理员账户
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库和表（确保 MySQL 已安装并运行）
npx prisma db push

# 初始化数据
pnpm run db:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000 查看博客首页。

## 使用指南

### 管理后台

1. 访问 `/login` 页面
2. 使用配置的管理员邮箱和密码登录
3. 登录后可访问 `/admin` 管理页面
4. 点击"新建文章"创建文章
5. 在编辑器中编写内容，支持 Markdown 语法
6. 点击"发布"按钮发布文章

### 文章管理

- 草稿会自动保存
- 支持搜索和标签筛选
- 已发布文章可以继续编辑
- 文章支持软删除

### API 接口

主要 API 端点：

- `GET /api/posts` - 获取文章列表
- `GET /api/posts/[slug]` - 获取文章详情
- `POST /api/posts` - 创建文章（需认证）
- `PATCH /api/posts/[id]` - 更新文章（需认证）
- `POST /api/posts/[id]/publish` - 发布文章（需认证）
- `GET /api/tags` - 获取标签列表

## 项目结构

```
blog/
├── docs/                   # PRD 文档
├── prisma/                 # 数据库模型和种子文件
├── public/                 # 静态资源
├── src/
│   ├── app/               # Next.js App Router 页面
│   ├── components/        # React 组件
│   └── lib/              # 工具函数和配置
├── package.json
└── README.md
```

## 部署

### 环境变量配置

确保在生产环境中设置正确的环境变量：

- `DATABASE_URL` - 生产数据库连接字符串
- `NEXTAUTH_SECRET` - 强密码用于 JWT 签名
- `NEXTAUTH_URL` - 生产环境域名

### 数据库迁移

```bash
npx prisma migrate deploy
npx prisma generate
```

### 构建和启动

```bash
pnpm build
pnpm start
```

## 开发

### 数据库管理

```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma db push --force-reset
pnpm run db:seed
```

### 添加新功能

1. 更新 Prisma schema（如需要）
2. 运行数据库迁移
3. 创建相应的 API 路由
4. 实现前端组件

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 许可证

MIT License
