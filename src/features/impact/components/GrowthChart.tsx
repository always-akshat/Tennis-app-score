import type { MonthlyGrowth } from '@/types/impact.types';

interface GrowthChartProps {
  data: MonthlyGrowth[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  const maxValue = Math.max(...data.map((d) => d.youthReached));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary-500" />
          Total Youth
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500" />
          Girls
        </span>
      </div>

      <div className="space-y-3">
        {data.map((month) => (
          <div key={month.month} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="font-medium">{month.month}</span>
              <span>{month.youthReached.toLocaleString('en-IN')} youth</span>
            </div>
            {/* Total youth bar */}
            <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500 relative"
                style={{ width: `${(month.youthReached / maxValue) * 100}%` }}
              >
                {/* Girls overlay */}
                <div
                  className="absolute inset-y-0 left-0 bg-purple-500 rounded-full"
                  style={{ width: `${(month.girlsReached / month.youthReached) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{month.girlsReached.toLocaleString('en-IN')} girls ({Math.round((month.girlsReached / month.youthReached) * 100)}%)</span>
              <span>+{month.volunteersJoined} volunteers</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
