"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useContributions } from "@/hooks/use-contributions";
import { ContributionDay, getContributionLevel } from "@/types/contribution";
import { generateCalendarGrid } from "@/lib/contribution-utils";

interface ContributionHeatmapProps {
  className?: string;
  showSummary?: boolean;
  defaultYear?: number;
}

interface TooltipProps {
  day: ContributionDay;
  position: { x: number; y: number };
}

function ContributionTooltip({ day, position }: TooltipProps) {
  const date = new Date(day.date);
  const formattedDate = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-md shadow-lg p-3 min-w-[200px] pointer-events-none"
      style={{
        left: Math.max(10, Math.min(position.x - 100, window.innerWidth - 220)),
        top: Math.max(10, position.y - 80),
      }}
    >
      <div className="text-sm font-medium text-foreground">{formattedDate}</div>
      <div className="text-sm text-muted-foreground mt-1">
        {day.count > 0 ? `${day.count} 次贡献` : "无贡献"}
      </div>

      {day.activities.length > 0 && (
        <div className="mt-2 space-y-1">
          {day.activities.slice(0, 3).map((activity, index) => (
            <div key={index} className="text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block w-2 h-2 rounded-full mr-1",
                  activity.type === "publish" ? "bg-primary" : "bg-muted-foreground"
                )}
              />
              {activity.type === "publish" ? "发布" : "更新"}: {activity.title}
            </div>
          ))}
          {day.activities.length > 3 && (
            <div className="text-xs text-muted-foreground">
              还有 {day.activities.length - 3} 个活动...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function YearSelector({
  selectedYear,
  onYearChange,
}: {
  selectedYear: number;
  onYearChange: (year: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear];

  return (
    <div className="flex gap-2">
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={cn(
            "px-3 py-1 text-sm font-medium rounded transition-colors",
            selectedYear === year
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

function ContributionSummary({
  data,
}: {
  data: NonNullable<ReturnType<typeof useContributions>["summary"]>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="p-4 bg-card border border-border rounded">
        <div className="text-2xl font-bold text-primary">{data.total}</div>
        <div className="text-sm text-muted-foreground">总贡献</div>
      </div>
      <div className="p-4 bg-card border border-border rounded">
        <div className="text-2xl font-bold text-primary">{data.maxStreak}</div>
        <div className="text-sm text-muted-foreground">最长连续</div>
      </div>
      <div className="p-4 bg-card border border-border rounded">
        <div className="text-2xl font-bold text-primary">
          {data.currentStreak}
        </div>
        <div className="text-sm text-muted-foreground">当前连续</div>
      </div>
      <div className="p-4 bg-card border border-border rounded">
        <div className="text-2xl font-bold text-primary">
          {data.maxDayCount}
        </div>
        <div className="text-sm text-muted-foreground">单日最多</div>
      </div>
    </div>
  );
}

function ContributionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-53 gap-1 min-w-[800px]">
          {Array.from({ length: 53 * 7 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-muted animate-pulse rounded-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 热力图颜色样式映射
const heatmapColorStyles: Record<string, string> = {
  'heatmap-level-0': 'bg-[var(--heatmap-level-0)]',
  'heatmap-level-1': 'bg-[var(--heatmap-level-1)]',
  'heatmap-level-2': 'bg-[var(--heatmap-level-2)]',
  'heatmap-level-3': 'bg-[var(--heatmap-level-3)]',
  'heatmap-level-4': 'bg-[var(--heatmap-level-4)]',
};

function ContributionGrid({
  data,
  onDayHover,
}: {
  data: (ContributionDay | null)[][];
  onDayHover: (
    day: ContributionDay | null,
    position?: { x: number; y: number }
  ) => void;
}) {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="space-y-2">
      {/* 热力图 */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-1 w-full min-w-[800px] md:min-w-0">
          {/* 星期标签 */}
          <div className="flex flex-col gap-1 mr-2">
            {weekdays.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "w-6 h-3 flex items-center justify-center text-xs text-muted-foreground",
                  index % 2 === 0 ? "opacity-100" : "opacity-0"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 贡献网格 */}
          <div className="flex-1 grid grid-rows-7 grid-flow-col gap-1">
            {data.map((week, weekIndex) =>
              week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div key={`${weekIndex}-${dayIndex}`} className="w-3 h-3" />
                  );
                }

                const level = getContributionLevel(day.count);
                const colorClass = heatmapColorStyles[level.color] || 'bg-muted';

                return (
                  <div
                    key={day.date}
                    className={cn(
                      "w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-primary/50",
                      colorClass
                    )}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const scrollTop =
                        window.pageYOffset ||
                        document.documentElement.scrollTop;
                      onDayHover(day, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + scrollTop - 10,
                      });
                    }}
                    onMouseLeave={() => onDayHover(null)}
                    onClick={(e) => {
                      // 移动端点击显示tooltip
                      const rect = e.currentTarget.getBoundingClientRect();
                      const scrollTop =
                        window.pageYOffset ||
                        document.documentElement.scrollTop;
                      onDayHover(day, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + scrollTop - 10,
                      });
                      // 3秒后自动隐藏
                      setTimeout(() => onDayHover(null), 3000);
                    }}
                    title={`${day.date}: ${day.count} 次贡献`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContributionHeatmap({
  className,
  showSummary = true,
  defaultYear = new Date().getFullYear(),
}: ContributionHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [hoveredDay, setHoveredDay] = useState<{
    day: ContributionDay;
    position: { x: number; y: number };
  } | null>(null);

  const { contributions, summary, isLoading, error } = useContributions({
    year: selectedYear,
  });

  const calendarData = generateCalendarGrid(contributions, selectedYear);

  const handleDayHover = (
    day: ContributionDay | null,
    position?: { x: number; y: number }
  ) => {
    if (day && position) {
      setHoveredDay({ day, position });
    } else {
      setHoveredDay(null);
    }
  };

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-muted-foreground">加载创作指数失败</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <ContributionSkeleton />
      </div>
    );
  }

  const hasContributions = contributions.length > 0;

  return (
    <div className={cn("space-y-4 p-6 bg-card border border-border rounded", className)}>
      {/* 年份选择和图例 */}
      <div className="flex items-center justify-between">
        <YearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
        <div className="flex items-center">
          <span className="mr-2 text-xs text-muted-foreground">不活跃</span>
          <div className="flex gap-1">
            {[0, 1, 2, 4, 7].map((count) => {
              const level = getContributionLevel(count);
              const colorClass = heatmapColorStyles[level.color] || 'bg-muted';
              return (
                <div
                  key={count}
                  className={cn("w-3 h-3 rounded-sm", colorClass)}
                  title={level.label}
                />
              );
            })}
          </div>
          <span className="ml-2 text-xs text-muted-foreground">活跃</span>
        </div>
      </div>

      {showSummary && summary && <ContributionSummary data={summary} />}

      {hasContributions ? (
        <div className="relative">
          <ContributionGrid data={calendarData} onDayHover={handleDayHover} />

          {hoveredDay && (
            <ContributionTooltip
              day={hoveredDay.day}
              position={hoveredDay.position}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-lg font-medium mb-2 text-foreground">快来写下第一篇文章吧！</div>
          <div className="text-sm text-muted-foreground mb-4">
            {selectedYear} 年还没有任何贡献记录
          </div>
          <div className="text-xs text-muted-foreground">
            开始创作，记录你的技术成长轨迹
          </div>
        </div>
      )}
    </div>
  );
}
