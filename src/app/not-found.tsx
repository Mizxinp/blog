import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-6">页面不存在</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          抱歉，您访问的页面不存在或已被删除。
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/posts">查看文章</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 