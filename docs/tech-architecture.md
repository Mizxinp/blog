---
title: 技术架构说明（个人技术博客）
version: v0
owner: you
---

# 技术架构说明（个人技术博客）

> 本文档描述技术栈、数据库模型（Prisma）、核心 API 协议（含统一响应格式），适用于 **单作者个人博客**。不包含部署/运维。

---

## 1. 技术栈总览
- **框架**：Next.js（App Router）
- **UI**：Tailwind CSS + shadcn/ui
- **数据库**：MySQL 8.x
- **ORM**：Prisma
- **认证**：单作者简化认证（自定义密码登录 / 环境变量 Token / Basic Auth 均可；MVP 任选其一）
- **Markdown 渲染**：remark + rehype + shiki（代码高亮）
- **内容编辑模型**：前端块编辑（Notion 风），存储落地 Markdown（contentMd）；服务端可缓存 contentHtml。

---

## 2. 业务角色简化
| 角色 | 权限 | 说明 |
| --- | --- | --- |
| 访客（匿名） | GET 首页/列表/详情 | 互联网访问者。 |
| 站长（作者） | GET + 新建、编辑、发布、删除、标签管理 | 唯一账号。 |

---

## 3. 数据模型（Prisma Schema）

```prisma
// schema.prisma

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  OWNER // 唯一站长
}

enum PostStatus {
  DRAFT
  PUBLISHED
  DELETED_SOFT
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // hash
  name      String?
  avatarUrl String?
  role      Role     @default(OWNER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id          Int         @id @default(autoincrement())
  slug        String      @unique
  title       String
  summary     String?     @db.Text
  contentMd   String      @db.LongText
  contentHtml String?     @db.LongText
  status      PostStatus  @default(DRAFT)
  publishAt   DateTime?
  author      User        @relation(fields: [authorId], references: [id])
  authorId    Int
  tags        PostTag[]
  coverUrl    String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?
}

model Tag {
  id    Int       @id @default(autoincrement())
  name  String
  slug  String    @unique
  posts PostTag[]
}

model PostTag {
  post   Post @relation(fields: [postId], references: [id])
  postId Int
  tag    Tag  @relation(fields: [tagId], references: [id])
  tagId  Int
  @@id([postId, tagId])
}
```

> 若后续需要分类，可追加 `Category` 表并在 `Post` 中关联。

---

## 4. 通用数据字段规范
- `id`：自增主键。
- `slug`：URL 标识，唯一；默认由标题 slugify；允许手动修改（后续可做 redirect）。
- `status`：`DRAFT | PUBLISHED | DELETED_SOFT`。
- `publishAt`：发布时间；草稿为空。
- `createdAt` / `updatedAt`：时间戳。
- `deletedAt`：软删时间。

---

## 5. 统一 API 响应格式

所有接口返回：
```json
{ "code": "0", "result": <data>, "message": "" }
```
- `code="0"` 表示成功；非 0 表示业务错误（示例：`1001` 参数错误、`2001` 未授权、`4004` 未找到）。
- `result`：业务数据；失败可为 `null`。
- `message`：提示文案（错误时必填）。

**HTTP 与业务码建议：**
- HTTP Status：200/400/401/403/404/500。
- 业务码：前端以 `code` 作逻辑分支。

---

## 6. API 设计（MVP）

### 6.1 获取文章列表（公开）
**GET** `/api/posts`
| 参数 | 类型 | 说明 | 例 | 必填 |
| --- | --- | --- | --- | --- |
| page | number | 页码 | 1 | 否 |
| pageSize | number | 每页条数 | 10 | 否 |
| tag | string | 标签 slug | react | 否 |
| q | string | 搜索关键词 | next | 否 |
| status | string | ALL / DRAFT / PUBLISHED（仅作者生效） | ALL | 否 |

**响应 result：**
```json
{
  "items":[
    {
      "id":1,
      "slug":"hello-world",
      "title":"Hello World",
      "summary":"示例摘要...",
      "publishAt":"2025-07-01T00:00:00Z",
      "tags":[{"id":2,"name":"React","slug":"react"}],
      "coverUrl":null
    }
  ],
  "page":1,
  "pageSize":10,
  "total":27
}
```

---

### 6.2 获取文章详情（公开已发布；作者可见草稿）
**GET** `/api/posts/{slug}`
- 未发布 & 非作者：返回 HTTP 404 + `code="4004"`。
- 作者登录：可获取草稿。

---

### 6.3 创建文章（草稿）
**POST** `/api/posts`
```json
{ "title": "未命名文章" }
```
**响应：**
```json
{ "code": "0", "result": { "id":123, "slug":"untitled-123", "status":"DRAFT" }, "message":"" }
```

---

### 6.4 更新文章（草稿或已发布）
**PATCH** `/api/posts/{id}`
```json
{
  "title": "React 性能优化实践",
  "contentMd": "# React...",
  "summary": "讲 useMemo...",
  "tags": [1,2],
  "coverUrl": "https://example.com/cover.png"
}
```
**响应：**
```json
{ "code": "0", "result": { "id":123, "updatedAt":"2025-07-17T14:02:00Z" }, "message":"" }
```

---

### 6.5 发布文章
**POST** `/api/posts/{id}/publish`
```json
{ "publishAt": null }
```
> `null` = 立即发布；后续可支持未来时间排期。

**响应：**
```json
{ "code": "0", "result": { "id":123, "slug":"react-performance", "status":"PUBLISHED", "publishAt":"2025-07-17T14:05:00Z" }, "message":"" }
```

---

### 6.6 删除文章（软删）
**DELETE** `/api/posts/{id}`
**响应：**
```json
{ "code": "0", "result": { "deleted": true }, "message":"" }
```

---

## 7. 鉴权简述（个人站）
- 所有 GET 接口匿名可访问（草稿除外）。
- 写操作需认证（Cookie / Token）。
- 因仅 1 个作者，可在服务端硬校验 `user.role === OWNER`。

---

## 8. Markdown 底层策略
- 前端 Notion 风块结构编辑。
- 保存时序列化为 Markdown（利于导出 / Git / RSS）。
- 服务端可在写入时生成 `contentHtml`（渲染缓存），详情页 SSR 加速。

---

## 9. 后续增强（非 MVP）
- 历史版本/回滚
- 草稿自动备份多版本
- 静态导出（MD -> MDX -> 静态站）
- RSS / Sitemap
- Slug 修改后 redirect
