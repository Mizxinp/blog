#!/bin/bash

# 构建 Next.js 应用
echo "🏗️  开始构建 Next.js 应用..."
pnpm build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 复制静态文件到 standalone 目录
echo "📁 复制静态文件..."

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

echo "🎉 Standalone 构建完成！"
echo "💡 启动命令: cd .next/standalone && node server.js" 