import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import "./globals.css";


export const metadata: Metadata = {
  title: "墨舟的博客 - 记录技术探索与生活思考",
  description: "一个基于 Next.js 构建的现代化技术博客，分享前端开发、全栈技术等相关内容",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="antialiased bg-background"
      >
        <ThemeProvider>
          <Navigation />
          <main className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
