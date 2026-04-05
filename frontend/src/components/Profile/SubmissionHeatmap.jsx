import { useState } from 'react';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(count) {
  if (!count) return '#1f2937';
  if (count <= 2)  return '#14532d';
  if (count <= 5)  return '#16a34a';
  if (count <= 9)  return '#22c55e';
  return '#4ade80';
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SubmissionHeatmap({ data = {} }) {
  const [tooltip, setTooltip] = useState(null);

  // Build weeks array
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());

  const weeks = [];
  const monthLabels = []; // { weekIndex, month }
  let lastMonth = -1;

  let cur = new Date(start);
  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().slice(0, 10);
      const isFuture = cur > today;
      week.push({ date: dateStr, count: isFuture ? -1 : (data[dateStr] || 0) });
      cur.setDate(cur.getDate() + 1);
    }
    // Track month label for first day of week
    const firstDay = new Date(week[0].date + 'T00:00:00');
    const month = firstDay.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ weekIndex: weeks.length, label: MONTHS[month] });
      lastMonth = month;
    }
    weeks.push(week);
  }

  const totalSubmissions = Object.values(data).reduce((a, b) => a + b, 0);
  const gridWidth = weeks.length * (CELL_SIZE + CELL_GAP);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">

        {/* Month labels */}
        <div className="flex mb-1 ml-8" style={{ width: gridWidth }}>
          {monthLabels.map(({ weekIndex, label }) => (
            <div key={`${weekIndex}-${label}`}
              className="text-xs text-gray-500 absolute"
              style={{ left: weekIndex * (CELL_SIZE + CELL_GAP) }}>
              {label}
            </div>
          ))}
          {/* spacer to maintain height */}
          <div className="h-4 relative w-full" />
        </div>

        {/* Grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap: CELL_GAP }}>
            {DAYS.map((day, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-center justify-end pr-1"
                style={{ height: CELL_SIZE, width: 28, fontSize: 9 }}>
                {day}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex" style={{ gap: CELL_GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: CELL_GAP }}>
                {week.map((day) => (
                  <div
                    key={day.date}
                    className="rounded-sm cursor-pointer transition-opacity hover:opacity-70 relative"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: day.count < 0 ? 'transparent' : getColor(day.count)
                    }}
                    onMouseEnter={(e) => {
                      if (day.count >= 0) {
                        setTooltip({
                          date: day.date,
                          count: day.count,
                          x: e.clientX,
                          y: e.clientY
                        });
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
        <div className="flex items-center justify-between mt-3 ml-8">
          <p className="text-xs text-gray-500">{totalSubmissions} submissions in the last year</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Less</span>
            {['#1f2937', '#14532d', '#16a34a', '#22c55e', '#4ade80'].map(c => (
              <div key={c} className="rounded-sm"
                style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-gray-700 border border-gray-600 text-white text-xs px-2.5 py-1.5 rounded-lg pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}>
          {formatDate(tooltip.date)}: <span className="font-semibold">{tooltip.count}</span> submission{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
