# 多阶段构建处理 pnpm 符号链接问题
FROM node:20-alpine AS deps

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件和 prisma schema
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/

# 使用 pnpm 安装依赖（生产环境）
RUN pnpm install --prod --force --registry="http://registry.npmmirror.com"

# 生成 Prisma 客户端
RUN npx prisma generate

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 应用（但不包括有问题的 node_modules）
COPY --chown=nextjs:nodejs .next/standalone/package.json ./
COPY --chown=nextjs:nodejs .next/standalone/server.js ./
COPY --chown=nextjs:nodejs .next/standalone/.next ./.next
COPY --chown=nextjs:nodejs .next/standalone/src ./src

# 复制静态文件
COPY --chown=nextjs:nodejs .next/static ./.next/static

# 复制真实的 node_modules（不是符号链接）
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# 复制环境变量文件
COPY --chown=nextjs:nodejs .env ./

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"] 