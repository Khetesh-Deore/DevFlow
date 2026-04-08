import { useState, useMemo } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(count) {
  if (!count) return '#1f2937';
  if (count === 1) return '#14532d';
  if (count <= 3) return '#166534';
  if (count <= 6) return '#16a34a';
  return '#4ade80';
}

const CELL = 12;
const GAP  = 3;
const STEP = CELL + GAP;

export default function SubmissionHeatmap({ data = {} }) {
  const [tooltip, setTooltip] = useState(null);

  const { weeks, monthLabels, totalCount } = useMemo(() => {
    // Get current date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    
    const today = new Date(istNow.toISOString().slice(0, 10) + 'T00:00:00Z');

    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7 + 1);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const weeks = [];
    const monthLabels = [];
    let lastMonth = -1;
    let cur = new Date(start);

    while (cur <= today) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const ds = cur.toISOString().slice(0, 10);
        week.push({
          date: ds,
          count: data[ds] || 0,
          isFuture: cur > today
        });
        cur.setDate(cur.getDate() + 1);
      }
      const firstDay = new Date(week[0].date + 'T00:00:00');
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ weekIdx: weeks.length, label: MONTHS[month] });
        lastMonth = month;
      }
      weeks.push(week);
    }

    const totalCount = Object.values(data).reduce((a, b) => a + b, 0);
    return { weeks, monthLabels, totalCount };
  }, [data]);

  const DAY_LABEL_WIDTH = 28;
  const gridWidth = weeks.length * STEP - GAP;

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: DAY_LABEL_WIDTH + gridWidth + 8 }}>

        {/* Month labels row */}
        <div className="flex mb-1" style={{ paddingLeft: DAY_LABEL_WIDTH + 4 }}>
          <div className="relative" style={{ width: gridWidth, height: 16 }}>
            {monthLabels.map(({ weekIdx, label }, i) => (
              <span
                key={i}
                className="absolute text-xs text-gray-500 select-none"
                style={{ left: weekIdx * STEP, top: 0, whiteSpace: 'nowrap' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Grid row: day labels + cells */}
        <div className="flex" style={{ gap: 0 }}>

          {/* Day labels */}
          <div className="flex flex-col shrink-0" style={{ width: DAY_LABEL_WIDTH, gap: GAP, marginRight: 4 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-gray-600 flex items-center justify-end pr-1 select-none"
                style={{ height: CELL, fontSize: 9 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="rounded-sm cursor-pointer"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: day.isFuture ? 'transparent' : getColor(day.count),
                      opacity: day.isFuture ? 0 : 1
                    }}
                    onMouseEnter={e => {
                      if (!day.isFuture) {
                        setTooltip({ date: day.date, count: day.count, x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2" style={{ paddingLeft: DAY_LABEL_WIDTH + 4 }}>
          <p className="text-xs text-gray-500">
            {totalCount} submission{totalCount !== 1 ? 's' : ''} in the last year
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span>Less</span>
            {['#1f2937','#14532d','#166534','#16a34a','#4ade80'].map(c => (
              <div key={c} className="rounded-sm" style={{ width: CELL, height: CELL, backgroundColor: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <span className="font-medium">{tooltip.date}</span>
          <span className="text-gray-400 ml-1.5">
            {tooltip.count} submission{tooltip.count !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
