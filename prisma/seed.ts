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

  // 创建更多测试文章以展示创作指数
  const articles = [
    {
      title: 'React 19 新特性深度解析',
      summary: '深入了解 React 19 带来的革命性变化，包括新的服务器组件和并发特性。',
      slug: 'react-19-features',
      publishAt: new Date('2024-12-01'),
      tags: [reactTag.id, typescriptTag.id]
    },
    {
      title: 'Next.js 15 性能优化实战',
      summary: '实战演示如何在 Next.js 15 中实现极致的性能优化，包括图片优化、代码分割等。',
      slug: 'nextjs-15-performance',
      publishAt: new Date('2024-11-15'),
      tags: [nextjsTag.id, reactTag.id]
    },
    {
      title: 'TypeScript 5.0 新功能指南',
      summary: 'TypeScript 5.0 引入了许多激动人心的新功能，让我们一起探索这些改进。',
      slug: 'typescript-5-guide',
      publishAt: new Date('2024-10-20'),
      tags: [typescriptTag.id]
    },
    {
      title: '现代化 CSS 技巧与实践',
      summary: '探索最新的 CSS 特性，包括 Grid、Flexbox、自定义属性等现代化布局技术。',
      slug: 'modern-css-techniques',
      publishAt: new Date('2024-09-10'),
      tags: []
    },
    {
      title: 'Web 性能优化的完整指南',
      summary: '从网络优化到渲染性能，全方位提升 Web 应用的性能表现。',
      slug: 'web-performance-guide',
      publishAt: new Date('2024-08-25'),
      tags: [reactTag.id]
    }
  ];

  for (const article of articles) {
    const post = await prisma.post.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        contentMd: `# ${article.title}\n\n${article.summary}\n\n这是一篇示例文章，用于展示创作指数功能。`,
        status: 'PUBLISHED',
        publishAt: article.publishAt,
        authorId: admin.id,
        tags: {
          create: article.tags.map(tagId => ({ tagId }))
        }
      }
    });
    console.log(`创建文章: ${post.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 