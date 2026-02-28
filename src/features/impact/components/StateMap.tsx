import type { StateWiseStats } from '@/types/impact.types';

interface StateMapProps {
  data: StateWiseStats[];
}

export function StateMap({ data }: StateMapProps) {
  const maxYouth = Math.max(...data.map((d) => d.youthReached));

  return (
    <div className="space-y-3">
      {data.map((state) => {
        const intensity = Math.round((state.youthReached / maxYouth) * 100);

        return (
          <div key={state.state} className="flex items-center gap-3">
            {/* State bar */}
            <div className="w-32 sm:w-40 text-sm font-medium text-gray-700 truncate flex-shrink-0">
              {state.state}
            </div>
            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${intensity}%`,
                  background: `linear-gradient(90deg, #16a34a ${Math.min(intensity, 70)}%, #15803d)`,
                }}
              />
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-xs font-medium text-gray-700">
                  {state.youthReached.toLocaleString('en-IN')} youth
                </span>
              </div>
            </div>
            <div className="flex gap-3 text-xs text-gray-500 flex-shrink-0">
              <span title="Communities">{state.communities}C</span>
              <span title="Volunteers">{state.volunteers}V</span>
              {state.openIssues > 0 && (
                <span className="text-red-500" title="Open Issues">{state.openIssues}!</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
