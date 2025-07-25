export interface ContributionActivity {
  type: 'publish' | 'update';
  postId: number;
  title: string;
}

export interface ContributionDay {
  date: string;   // YYYY-MM-DD 格式
  count: number;  // 当天贡献次数
  activities: ContributionActivity[];
}

export interface ContributionSummary {
  total: number;        // 总贡献数
  maxStreak: number;    // 最长连续天数
  currentStreak: number; // 当前连续天数
  maxDayCount: number;  // 单日最多贡献数
  year: number;         // 统计年份
}

export interface ContributionLevel {
  min: number;
  max: number;
  color: string;
  label: string;
}

export const CONTRIBUTION_LEVELS: ContributionLevel[] = [
  { min: 0, max: 0, color: 'bg-gray-100 dark:bg-gray-800', label: '无贡献' },
  { min: 1, max: 1, color: 'bg-green-200 dark:bg-green-900', label: '少量贡献' },
  { min: 2, max: 3, color: 'bg-green-400 dark:bg-green-700', label: '一般贡献' },
  { min: 4, max: 6, color: 'bg-green-600 dark:bg-green-500', label: '活跃贡献' },
  { min: 7, max: Infinity, color: 'bg-green-800 dark:bg-green-300', label: '超活跃' }
];

export function getContributionLevel(count: number): ContributionLevel {
  return CONTRIBUTION_LEVELS.find(level => count >= level.min && count <= level.max) 
    || CONTRIBUTION_LEVELS[CONTRIBUTION_LEVELS.length - 1];
} 