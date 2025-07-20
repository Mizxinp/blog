import { notFound } from "next/navigation";
import Link from "next/link";
import "@/components/tiptap-editor.css";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    title: `${post.title} - 技术博客`,
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
        <Button variant="ghost" size="sm" asChild>
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回文章列表
          </Link>
        </Button>
      </div>

      {/* 文章头部 */}
      <article className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight text-foreground">
            {post.title}
          </h1>

          {/* 文章元信息 */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
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

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                更新于 {new Date(post.updatedAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
            {/* 标签 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {post.tags.map((tag) => (
                  <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary/10 transition-colors text-xs"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* 文章内容 */}
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border">
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

        {/* 文章底部 */}
        <footer className="mt-20 pt-12 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {/* 感谢阅读！如果觉得有用，欢迎分享给更多人。 */}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/posts">更多文章</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/">返回首页</Link>
              </Button>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
