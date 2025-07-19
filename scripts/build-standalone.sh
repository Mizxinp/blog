#!/bin/bash

echo "🏗️  开始构建生产部署包..."

# 设置错误时退出
set -e

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf .next blog-deploy-package

# 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
pnpm build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ Next.js 构建成功"

# 复制静态文件到 standalone 目录
echo "📁 复制静态文件到 standalone..."

# 复制 static 文件夹
if [ -d ".next/static" ]; then
    cp -r .next/static .next/standalone/.next/
    echo "✅ 已复制 .next/static"
else
    echo "⚠️  .next/static 目录不存在"
fi

# 复制 public 文件夹
if [ -d "public" ]; then
    cp -r public .next/standalone/
    echo "✅ 已复制 public"
else
    echo "⚠️  public 目录不存在"
fi

# 创建部署目录
echo "📦 创建部署包目录..."
mkdir -p blog-deploy-package

# 优化复制构建产物（排除不必要的文件）
echo "📋 复制优化后的 Next.js 构建产物..."
mkdir -p blog-deploy-package/.next

# 复制 standalone 目录但排除 node_modules（Dockerfile 会重新安装）
echo "🚀 复制 standalone 文件（排除 node_modules）..."
mkdir -p blog-deploy-package/.next/standalone
cp .next/standalone/package.json blog-deploy-package/.next/standalone/
cp .next/standalone/server.js blog-deploy-package/.next/standalone/
cp -r .next/standalone/.next blog-deploy-package/.next/standalone/
if [ -d ".next/standalone/src" ]; then
    cp -r .next/standalone/src blog-deploy-package/.next/standalone/
fi
if [ -d ".next/standalone/public" ]; then
    cp -r .next/standalone/public blog-deploy-package/.next/standalone/
fi
echo "✅ 已排除 standalone 中的 node_modules（164M）"

# 复制其他必要的目录
cp -r .next/static blog-deploy-package/.next/
cp -r .next/server blog-deploy-package/.next/

# 复制必要的配置文件
for file in BUILD_ID package.json routes-manifest.json prerender-manifest.json images-manifest.json app-path-routes-manifest.json build-manifest.json export-marker.json react-loadable-manifest.json app-build-manifest.json required-server-files.json next-server.js.nft.json next-minimal-server.js.nft.json; do
    if [ -f ".next/$file" ]; then
        cp ".next/$file" blog-deploy-package/.next/
    fi
done

# 复制 trace 目录（如果存在）
if [ -d ".next/trace" ]; then
    cp -r .next/trace blog-deploy-package/.next/
fi

# 复制 types 目录（如果存在）
if [ -d ".next/types" ]; then
    cp -r .next/types blog-deploy-package/.next/
fi

echo "✅ 已排除缓存文件和冗余的 node_modules，仅复制生产必需文件"

# 复制部署相关文件
echo "📄 复制部署配置文件..."
cp deploy.sh blog-deploy-package/
cp Dockerfile blog-deploy-package/
cp .dockerignore blog-deploy-package/
cp package.json blog-deploy-package/
cp pnpm-lock.yaml blog-deploy-package/

# 复制 prisma 目录
echo "🗄️  复制 Prisma 配置..."
cp -r prisma blog-deploy-package/

# 复制环境变量文件（如果存在）
if [ -f ".env" ]; then
    cp .env blog-deploy-package/
    echo "✅ 已复制 .env"
else
    echo "⚠️  .env 文件不存在，请确保在服务器上创建"
fi

# 创建部署说明文件
echo "📝 创建部署说明..."
cat > blog-deploy-package/DEPLOY_README.md << 'EOF'
# 生产部署说明

## 部署步骤

1. 将整个 blog-deploy-package 目录上传到服务器
2. 进入 blog-deploy-package 目录：`cd blog-deploy-package`
3. 确保有 .env 文件（如果没有，请创建并配置数据库连接等环境变量）
4. 执行部署脚本：`chmod +x deploy.sh && ./deploy.sh`

## 环境要求

- Docker
- node:20-alpine 镜像（会自动拉取）

## 目录结构

```
blog-deploy-package/
├── .next/                   # Next.js 构建产物（已优化）
│   ├── standalone/          # 独立运行文件（无 node_modules）
│   ├── static/             # 静态资源
│   ├── server/             # 服务器端代码
│   └── *.json              # 配置文件
├── prisma/                  # 数据库配置
├── Dockerfile               # Docker 配置
├── .dockerignore           # Docker 忽略文件
├── deploy.sh               # 部署脚本
├── package.json            # 依赖配置
├── pnpm-lock.yaml         # 锁定文件
├── .env                    # 环境变量（需要配置）
└── DEPLOY_README.md        # 本说明文件
```

## 高级优化说明

此部署包已经进行了以下优化：
- ❌ 排除了 .next/cache 目录（95M+ 缓存文件）
- ❌ 排除了 standalone 中的 node_modules（164M）
- ✅ Dockerfile 会重新安装生产依赖，确保依赖干净且最小化
- ✅ 仅包含运行时必需的 standalone 文件
- ✅ 包含所有静态资源和服务器代码

## Dockerfile 工作原理

1. **第一阶段 (deps)**：安装纯生产依赖
2. **第二阶段 (runner)**：复制应用代码 + 第一阶段的 node_modules
3. **最终结果**：干净的生产环境，无开发依赖

## 注意事项

- 确保 .env 文件包含正确的数据库连接配置
- 首次部署时会自动安装依赖和生成 Prisma 客户端
- 应用将运行在 3000 端口
- 构建包大小已优化至最小，仅保留运行必需文件
EOF

# 显示部署包大小
echo "📊 部署包大小统计..."
du -sh blog-deploy-package
echo ""

# 显示 .next 目录大小分析
echo "📈 .next 目录大小分析："
if [ -d "blog-deploy-package/.next" ]; then
    echo "总大小: $(du -sh blog-deploy-package/.next | cut -f1)"
    echo "详细分析:"
    du -sh blog-deploy-package/.next/* | sort -hr
fi

# 显示优化效果
echo ""
echo "💾 优化效果："
original_size=$(du -sh .next 2>/dev/null | cut -f1 || echo "N/A")
optimized_size=$(du -sh blog-deploy-package/.next 2>/dev/null | cut -f1 || echo "N/A")
echo "   原始 .next 大小: $original_size"
echo "   优化后大小: $optimized_size"
echo "   已排除："
echo "   - .next/cache（95M+ 缓存文件）"
echo "   - standalone/node_modules（164M 冗余依赖）"
echo "   - 其他开发相关文件"

echo ""
echo "🎉 部署包构建完成！"
echo "📁 部署包位置: ./blog-deploy-package/"
echo "📦 优化说明：Dockerfile 会重新安装依赖，确保生产环境纯净"
echo "📤 请将整个 blog-deploy-package 目录上传到服务器"
echo "🚀 在服务器上运行: cd blog-deploy-package && chmod +x deploy.sh && ./deploy.sh" 