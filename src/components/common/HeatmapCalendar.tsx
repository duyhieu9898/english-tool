import React, { useMemo, useState } from 'react';
import { StudyLog } from '@/types';

// Cell = 16px (w-4) + gap = 4px (gap-1) → each column is 20px wide
const CELL_SIZE = 16;
const GAP = 4;
const COL_WIDTH = CELL_SIZE + GAP;

interface HeatmapCalendarProps {
  logs: StudyLog[];
  dailyGoal?: number; // base multiplier for color thresholds
}

type CellData = {
  date: string;
  count: number;
  details: string;
  isFuture: boolean;
};

// Build a full-year grid from Jan 1 to Dec 31, Monday-start
function buildYearGrid(year: number, logMap: Record<string, StudyLog>) {
  const startDate = new Date(year, 0, 1); // Jan 1
  const endDate = new Date(year, 11, 31); // Dec 31
  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);

  // Monday-start offset: Mon=0, Tue=1, ..., Sun=6
  const getMondayOffset = (d: Date) => (d.getDay() + 6) % 7;
  const startOffset = getMondayOffset(startDate);

  const cells: (CellData | null)[] = [];

  // Pad with nulls to align first day to its weekday column
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }

  // Fill all days of the year
  const current = new Date(startDate);
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const log = logMap[dateStr];
    const learned = log?.wordsLearned ?? 0;
    const reviewed = log?.wordsReviewed ?? 0;
    const isFuture = current > todayZero;

    cells.push({
      date: dateStr,
      count: learned + reviewed,
      details: isFuture ? 'No data yet' : `${learned} learned, ${reviewed} reviewed`,
      isFuture,
    });

    current.setDate(current.getDate() + 1);
  }

  // Chunk into weeks (columns of 7)
  const weeks: (CellData | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Compute month label positions (week column index when a new month starts)
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, wi) => {
    // Take the first non-null day of the week
    const firstDay = week.find((c) => c !== null);
    if (!firstDay) return;

    const d = new Date(firstDay.date);
    const month = d.getMonth();

    if (month !== lastMonth) {
      // Avoid showing a label if the column is too close to the previous one (< 2 weeks)
      const prevIndex =
        monthLabels.length > 0 ? monthLabels[monthLabels.length - 1].weekIndex : -10;
      if (wi - prevIndex >= 2 || monthLabels.length === 0) {
        monthLabels.push({
          label: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          weekIndex: wi,
        });
        lastMonth = month;
      }
    }
  });

  return { cells, weeks, monthLabels };
}

// Thresholds based on dailyGoal: level 1 = 1x, 2 = 2x, 3 = 3x, 4+ = 4x
function getColorClass(count: number, isFuture: boolean, base: number) {
  if (isFuture) return 'bg-gray-100 dark:bg-gray-800/20';
  if (count === 0) return 'bg-gray-100 dark:bg-gray-800/50';
  if (count < base) return 'bg-lime-200 dark:bg-lime-900/50';
  if (count < base * 2) return 'bg-lime-400 dark:bg-lime-900/50';
  if (count < base * 3) return 'bg-lime-500 dark:bg-lime-700/70';
  if (count < base * 4) return 'bg-lime-600 dark:bg-lime-600';

  return 'bg-lime-700 dark:bg-lime-400';
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ logs, dailyGoal = 20 }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const logMap = useMemo(() => {
    const map: Record<string, StudyLog> = {};
    logs.forEach((log) => {
      map[log.date] = log;
    });
    return map;
  }, [logs]);

  const { weeks, monthLabels } = useMemo(
    () => buildYearGrid(selectedYear, logMap),
    [selectedYear, logMap],
  );


  return (
    <div className="w-full flex items-start gap-4 md:gap-6">
      {/* Main heatmap area */}
      <div className="flex-1 min-w-0">
        {/* Grid area: day labels + cells */}
        <div className="flex items-start gap-1.5">
          {/* Day labels */}
          <div className="hidden sm:flex flex-col text-[10px] text-gray-400 dark:text-gray-500 font-bold shrink-0 w-8 text-right mt-5">
            {/* Each row is CELL_SIZE=16px, gap between rows=4px */}
            <div style={{ height: CELL_SIZE }} className="flex items-center justify-end">
              Mon
            </div>
            <div style={{ height: CELL_SIZE, marginTop: GAP }} />
            <div
              style={{ height: CELL_SIZE, marginTop: GAP }}
              className="flex items-center justify-end"
            >
              Wed
            </div>
            <div style={{ height: CELL_SIZE, marginTop: GAP }} />
            <div
              style={{ height: CELL_SIZE, marginTop: GAP }}
              className="flex items-center justify-end"
            >
              Fri
            </div>
            <div style={{ height: CELL_SIZE, marginTop: GAP }} />
            <div
              style={{ height: CELL_SIZE, marginTop: GAP }}
              className="flex items-center justify-end"
            >
              Sun
            </div>
          </div>

          {/* Cell grid: columns of 7 rows */}
          <div className="overflow-x-auto flex-1 pb-2">
            {/* Month labels row */}
            <div className="relative h-4 mb-1 ml-0">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="absolute text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest whitespace-nowrap"
                  style={{ left: `${m.weekIndex * COL_WIDTH}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="flex gap-1" style={{ minWidth: `${weeks.length * COL_WIDTH - GAP}px` }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((cell, di) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${wi}-${di}`}
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        />
                      );
                    }
                    return (
                      <div
                        key={cell.date}
                        title={`${cell.date}: ${cell.details}`}
                        aria-label={`${cell.date}: ${cell.details}`}
                        role="gridcell"
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        className={[
                          'rounded-[3px] border border-black/5 dark:border-white/5 cursor-pointer transition-opacity hover:opacity-80',
                          getColorClass(cell.count, cell.isFuture, dailyGoal),
                        ].join(' ')}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, dailyGoal, dailyGoal * 2, dailyGoal * 3, dailyGoal * 4].map((c) => (
                <div
                  key={c}
                  style={{ width: 12, height: 12 }}
                  className={`rounded-[2px] ${getColorClass(c, false, dailyGoal)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex flex-col gap-1 shrink-0 text-sm font-black pt-5">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={[
              'px-3 py-1.5 rounded-lg text-left transition-all',
              selectedYear === y
                ? 'bg-blue-500 text-white dark:bg-blue-400 dark:text-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
};
