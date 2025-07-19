#!/bin/bash

echo "开始部署博客应用..."

# 设置错误时退出
set -e

# 配置变量
IMAGE_NAME="blog-app"
CONTAINER_NAME="blog-app"
PORT="3000"

# 检查构建文件
echo "检查构建文件..."
if [ ! -d ".next/standalone" ]; then
    echo "❌ 错误：未找到 .next/standalone 目录"
    echo "请确保已经运行了 'pnpm build:standalone'"
    exit 1
fi

if [ ! -d ".next/static" ]; then
    echo "❌ 错误：未找到 .next/static 目录"
    exit 1
fi

echo "✅ 构建文件检查通过"

# 检查本地是否有 node:20-alpine 镜像
echo "检查本地 node:20-alpine 镜像..."
if ! docker images | grep -q "node.*20-alpine"; then
    echo "❌ 错误：未找到本地 node:20-alpine 镜像"
    echo "请先拉取镜像: docker pull node:20-alpine"
    exit 1
fi

echo "✅ 发现本地 node:20-alpine 镜像"

# 停止并删除现有容器
echo "停止现有容器..."
docker stop $CONTAINER_NAME 2>/dev/null || echo "容器不存在，跳过停止"
docker rm $CONTAINER_NAME 2>/dev/null || echo "容器不存在，跳过删除"

# 删除旧镜像
echo "删除旧镜像..."
docker rmi $IMAGE_NAME 2>/dev/null || echo "镜像不存在，跳过删除"

# 构建镜像 (在容器中安装依赖)
echo "构建 Docker 镜像（在容器中安装依赖）..."
DOCKER_BUILDKIT=0 docker build --pull=false -t $IMAGE_NAME .

# 运行容器
echo "启动容器..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:3000 \
  $IMAGE_NAME

# 等待容器启动
echo "等待容器启动..."
sleep 5

# 检查容器状态
echo "检查容器状态..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ 容器启动成功"
    docker ps | grep $CONTAINER_NAME
else
    echo "❌ 容器启动失败"
    docker logs $CONTAINER_NAME --tail=20
    exit 1
fi

# 查看应用日志
echo ""
echo "应用日志："
docker logs $CONTAINER_NAME --tail=10

echo ""
echo "✅ 部署完成！"
echo "访问地址: http://localhost:$PORT"
echo "如果配置了域名，可通过域名访问"
echo ""
echo "管理命令："
echo "- 查看日志: docker logs -f $CONTAINER_NAME"
echo "- 重启应用: docker restart $CONTAINER_NAME"
echo "- 停止应用: docker stop $CONTAINER_NAME" 