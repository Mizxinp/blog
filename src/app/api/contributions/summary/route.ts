import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { withErrorHandling } from '@/lib/middleware';
import { calculateDailyContributions, calculateContributionSummary } from '@/lib/contribution-utils';

async function handleGetContributionSummary(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  
  // 验证年份参数
  if (isNaN(year) || year < 2020 || year > new Date().getFullYear() + 1) {
    return NextResponse.json(
      createErrorResponse('INVALID_PARAMS', '年份参数无效'),
      { status: 400 }
    );
  }

  try {
    // 查询该年份的所有发布文章和更新记录
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        OR: [
          // 发布贡献：发布时间在该年份
          {
            publishAt: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`)
            }
          },
          // 更新贡献：更新时间在该年份
          {
            updatedAt: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`)
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        publishAt: true,
        updatedAt: true,
        createdAt: true,
        contentMd: true
      }
    });

    // 计算每日贡献数据
    const contributions = calculateDailyContributions(posts, year);
    
    // 计算统计摘要
    const summary = calculateContributionSummary(contributions, year);
    
    return NextResponse.json(createSuccessResponse(summary));
  } catch (error) {
    console.error('获取贡献统计失败:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', '获取贡献统计失败'),
      { status: 500 }
    );
  }
}

export const GET = withErrorHandling(handleGetContributionSummary); 