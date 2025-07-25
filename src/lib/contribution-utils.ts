import { ContributionDay, ContributionActivity, ContributionSummary } from '@/types/contribution';

interface PostData {
  id: number;
  title: string;
  publishAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  contentMd: string;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 判断是否为显著更新（内容变化超过100字符或更新间隔超过1天）
 */
export function isSignificantUpdate(post: PostData): boolean {
  // 简化实现：如果更新时间与创建时间不同，且间隔超过1小时，则认为是显著更新
  const timeDiff = post.updatedAt.getTime() - post.createdAt.getTime();
  return timeDiff > 60 * 60 * 1000; // 1小时
}

/**
 * 添加贡献到Map中
 */
function addContribution(
  contributionMap: Map<string, ContributionDay>,
  date: string,
  type: 'publish' | 'update',
  post: PostData
) {
  if (!contributionMap.has(date)) {
    contributionMap.set(date, {
      date,
      count: 0,
      activities: []
    });
  }
  
  const dayData = contributionMap.get(date)!;
  dayData.count += 1;
  dayData.activities.push({
    type,
    postId: post.id,
    title: post.title
  });
}

/**
 * 计算每日贡献数据
 */
export function calculateDailyContributions(posts: PostData[], year: number): ContributionDay[] {
  const contributionMap = new Map<string, ContributionDay>();
  
  posts.forEach(post => {
    // 发布贡献
    if (post.publishAt && post.publishAt.getFullYear() === year) {
      const publishDate = formatDate(post.publishAt);
      addContribution(contributionMap, publishDate, 'publish', post);
    }
    
    // 更新贡献（排除发布当天的更新，且需要是显著更新）
    if (post.updatedAt.getFullYear() === year) {
      const updateDate = formatDate(post.updatedAt);
      const publishDate = post.publishAt ? formatDate(post.publishAt) : null;
      
      if (updateDate !== publishDate && isSignificantUpdate(post)) {
        addContribution(contributionMap, updateDate, 'update', post);
      }
    }
  });

  return Array.from(contributionMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * 计算贡献统计摘要
 */
export function calculateContributionSummary(contributions: ContributionDay[], year: number): ContributionSummary {
  const total = contributions.reduce((sum, day) => sum + day.count, 0);
  const maxDayCount = Math.max(...contributions.map(day => day.count), 0);
  
  // 计算最长连续天数和当前连续天数
  let maxStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  
  // 生成该年份所有日期
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);
  const contributionMap = new Map(contributions.map(day => [day.date, day.count]));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 重置时间到当天开始
  let isCurrentStreakActive = true;
  
  for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = formatDate(date);
    const hasContribution = contributionMap.has(dateStr) && contributionMap.get(dateStr)! > 0;
    
    if (hasContribution) {
      tempStreak += 1;
      maxStreak = Math.max(maxStreak, tempStreak);
      
      if (isCurrentStreakActive) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      
      // 如果当前日期已经过去，则当前连续记录中断
      if (date <= today && isCurrentStreakActive) {
        isCurrentStreakActive = false;
        currentStreak = 0;
      }
    }
  }
  
  return {
    total,
    maxStreak,
    currentStreak,
    maxDayCount,
    year
  };
}

/**
 * 生成日历网格数据 (7行 × 53列，按列排列，竖向连续)
 */
export function generateCalendarGrid(contributions: ContributionDay[], year: number) {
  const contributionMap = new Map(contributions.map(day => [day.date, day]));
  
  // 获取该年第一天是星期几 (0=周日, 1=周一, ..., 6=周六)
  const firstDay = new Date(year, 0, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  // 计算起始日期（从第一周的周日开始）
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);
  
  // 生成一年的所有日期
  const allDates: (ContributionDay | null)[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 53 * 7; i++) {
    const dateStr = formatDate(currentDate);
    
    // 只包含当前年份的日期
    if (currentDate.getFullYear() === year) {
      const contributionData = contributionMap.get(dateStr);
      allDates.push(contributionData || {
        date: dateStr,
        count: 0,
        activities: []
      });
    } else {
      allDates.push(null);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 重新组织数据：按列排列（每列7天，共53列）
  const weeks: (ContributionDay | null)[][] = [];
  
  for (let week = 0; week < 53; week++) {
    const weekData: (ContributionDay | null)[] = [];
    
    for (let day = 0; day < 7; day++) {
      const index = week * 7 + day;
      weekData.push(allDates[index] || null);
    }
    
    weeks.push(weekData);
  }
  
  return weeks;
} 