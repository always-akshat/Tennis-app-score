import type { StatCardProps } from '@/types/impact.types';

const colorMap = {
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    change: 'text-green-600',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    change: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
    change: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    change: 'text-purple-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    change: 'text-red-600',
  },
};

export function StatCard({ label, value, change, icon, color = 'green' }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`rounded-xl p-5 ${colors.bg} border border-gray-100`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${colors.change} font-medium`}>
              +{change}% this month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
