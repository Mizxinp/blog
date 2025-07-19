# 博客项目 Docker 部署指南

## 前提条件

- 服务器已安装 Docker
- 已配置好数据库（本地开发时的生产数据库）

## 部署步骤

### 1. 本地构建

```bash
# 在本地项目目录运行
# 1. 生成 Prisma 客户端（包含 Linux 二进制）
npx prisma generate

# 2. 构建 standalone 应用
pnpm build:standalone
```

### 2. 上传文件到服务器

将以下文件/目录上传到服务器的项目目录（如 `/data/blog/`）：

```bash
# 必需的文件
.next/standalone/     # 构建产物
.next/static/         # 静态资源
.env                 # 环境变量（数据库配置等）
Dockerfile           # Docker 配置
deploy.sh            # 部署脚本
.dockerignore        # Docker 忽略文件
```

### 3. 服务器部署

```bash
# 在服务器项目目录执行
chmod +x deploy.sh
./deploy.sh
```

## 使用示例

```bash
# 本地构建
npx prisma generate
pnpm build:standalone

# 上传到服务器（示例）
rsync -av .next/ user@server:/data/blog/.next/
rsync -av Dockerfile deploy.sh .dockerignore .env user@server:/data/blog/

# 在服务器执行
ssh user@server "cd /data/blog && ./deploy.sh"
```

## 管理命令

```bash
# 查看应用状态
docker ps | grep blog-app

# 查看应用日志
docker logs -f blog-app

# 重启应用
docker restart blog-app

# 停止应用
docker stop blog-app

# 重新部署
./deploy.sh
```

## 配置 nginx（可选）

如果需要通过域名访问，配置 nginx 反向代理：

```nginx
server {
    listen 80;
    server_name blog.zxingping.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 注意事项

1. 确保端口 3000 未被占用
2. 确保 `.env` 文件包含正确的数据库连接配置
3. Prisma schema 已配置 Linux 二进制目标（`binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]`）
4. 如有 SSL 需求，配置 nginx 的 HTTPS

## 故障排除

- **容器启动失败**：查看日志 `docker logs blog-app`
- **应用无法访问**：检查端口映射 `docker ps`
- **数据库连接错误**：检查环境变量配置 