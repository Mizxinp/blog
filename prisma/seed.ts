import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('997blog..', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: '博客管理员',
      role: 'OWNER'
    }
  })

  console.log('创建管理员用户:', admin)

  // 创建一些示例标签
  const reactTag = await prisma.tag.upsert({
    where: { slug: 'react' },
    update: {},
    create: {
      name: 'React',
      slug: 'react'
    }
  })

  const nextjsTag = await prisma.tag.upsert({
    where: { slug: 'nextjs' },
    update: {},
    create: {
      name: 'Next.js',
      slug: 'nextjs'
    }
  })

  const typescriptTag = await prisma.tag.upsert({
    where: { slug: 'typescript' },
    update: {},
    create: {
      name: 'TypeScript',
      slug: 'typescript'
    }
  })

  console.log('创建标签:', { reactTag, nextjsTag, typescriptTag })

  // 创建示例文章
  const samplePost = await prisma.post.upsert({
    where: { slug: 'hello-world' },
    update: {},
    create: {
      slug: 'hello-world',
      title: 'Hello World - 我的第一篇博客',
      summary: '欢迎来到我的技术博客！这是第一篇文章，介绍了博客的基本功能和后续的内容规划。',
      contentMd: `# Hello World - 我的第一篇博客

欢迎来到我的技术博客！🎉

## 关于这个博客

这是一个基于 **Next.js** 和 **Prisma** 构建的现代化技术博客系统，具有以下特性：

- 📝 **Notion 风格编辑器** - 所写即所见的流畅编写体验
- 🎨 **现代化 UI** - 基于 shadcn/ui 的美观界面
- 🔍 **全文搜索** - 快速找到你需要的内容
- 🏷️ **标签系统** - 灵活的内容分类管理
- 📱 **响应式设计** - 完美适配各种设备

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **数据库**: MySQL + Prisma ORM
- **Markdown**: remark + rehype
- **认证**: 自定义认证系统

## 后续计划

- [ ] 完善编辑器功能
- [ ] 添加评论系统
- [ ] SEO 优化
- [ ] RSS 订阅
- [ ] 暗黑模式

感谢你的访问，期待与你分享更多技术心得！`,
      status: 'PUBLISHED',
      publishAt: new Date(),
      authorId: admin.id,
      tags: {
        create: [
          { tagId: reactTag.id },
          { tagId: nextjsTag.id },
          { tagId: typescriptTag.id }
        ]
      }
    }
  })

  console.log('创建示例文章:', samplePost)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 