import { notFound } from "next/navigation";
import Link from "next/link";
import "@/components/tiptap-editor.css";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  contentHtml: string | null;
  contentMd: string;
  status: string;
  publishAt: string | null;
  updatedAt: string;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  coverUrl: string | null;
  author: {
    id: number;
    name: string | null;
    email: string;
  };
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXTAUTH_URL || "http://localhost:3000"
        : "";

    const response = await fetch(`${baseUrl}/api/posts/detail?slug=${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `获取文章详情失败: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    return data.code === "0" ? data.result : null;
  } catch (error) {
    console.error("获取文章详情失败:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    return {
      title: "文章不存在",
    };
  }

  return {
    title: `${post.title} - 墨舟的博客`,
    description: post.summary || "技术文章详情页",
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="py-8">
      {/* 返回按钮 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回文章列表
          </Link>
        </Button>
      </div>

      {/* 文章头部 */}
      <article className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          {/* 分类标签 */}
          {post.tags.length > 0 && (
            <div className="mb-6">
              <span className="text-xs text-primary tracking-widest uppercase">
                {post.tags[0].name}
              </span>
            </div>
          )}

          {/* 标题 */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-8 leading-relaxed tracking-wide text-foreground">
            {post.title}
          </h1>

          {/* 文章元信息 */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {post.publishAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(post.publishAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            <span className="text-border">·</span>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>阅读约 5 分钟</span>
            </div>
          </div>
        </header>

        {/* 装饰分隔线 */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="w-16 h-px bg-border" />
          <span className="text-muted-foreground text-xs">◇</span>
          <div className="w-16 h-px bg-border" />
        </div>

        {/* 文章内容 */}
        <div className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:text-foreground prose-headings:font-medium prose-headings:tracking-wide
          prose-p:text-foreground prose-p:leading-relaxed
          prose-strong:text-foreground
          prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-card prose-pre:border prose-pre:border-border
          prose-blockquote:border-l-primary prose-blockquote:border-l-[3px] prose-blockquote:bg-muted/50 prose-blockquote:italic
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded prose-img:shadow-lg
        ">
          {post.contentHtml ? (
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          ) : (
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: post.contentMd }}
            />
          )}
        </div>

        {/* 标签列表 */}
        {post.tags.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-3 justify-center">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                  <Badge
                    variant="outline"
                    className="text-sm py-1.5 px-4 border-border hover:border-primary hover:text-primary hover:bg-accent-soft transition-colors"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 文章底部 */}
        <footer className="mt-16 pt-12 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" asChild className="border-border hover:border-primary hover:text-primary">
              <Link href="/posts">更多文章 →</Link>
            </Button>
            <Button variant="default" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">返回首页</Link>
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
}
