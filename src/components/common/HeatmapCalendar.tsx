import React, { useMemo } from 'react';
import { StudyLog } from '../../types';

interface HeatmapCalendarProps {
  logs: StudyLog[];
  days?: number; // Number of days to display (e.g. 90 = ~3 months)
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ logs, days = 180 }) => {
  const logMap = useMemo(() => {
    const map: Record<string, StudyLog> = {};
    logs.forEach((log) => {
      map[log.date] = log;
    });
    return map;
  }, [logs]);

  const { dates, uniqueMonths } = useMemo(() => {
    const datesResult: ({ date: string; count: number; details: string } | null)[] = [];
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const startDate = new Date(todayZero);
    startDate.setDate(todayZero.getDate() - days + 1);

    // Monday-start logic (Monday = 0, ..., Sunday = 6)
    const getMondayStartDay = (d: Date) => (d.getDay() + 6) % 7;
    const startDay = getMondayStartDay(startDate);

    // Fill empty days for the first week to align Monday to the top row
    for (let i = 0; i < startDay; i++) {
      datesResult.push(null);
    }

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayZero);
      d.setDate(d.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const log = logMap[dateStr];
      const learned = log?.wordsLearned || 0;
      const reviewed = log?.wordsReviewed || 0;
      const total = learned + reviewed;
      
      datesResult.push({ 
        date: dateStr, 
        count: total, 
        details: `${learned} learned, ${reviewed} reviewed` 
      });
    }

    const weeks: (({ date: string; count: number; details: string } | null)[])[] = [];
    for (let i = 0; i < datesResult.length; i += 7) {
      weeks.push(datesResult.slice(i, i + 7));
    }

    const uniqueMonthList: { month: string; index: number }[] = [];
    let lastMonth = '';
    weeks.forEach((week, index) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const d = new Date(firstDay.date);
        const m = d.toLocaleString('en-US', { month: 'short' });
        if (m !== lastMonth) {
          uniqueMonthList.push({ month: m, index });
          lastMonth = m;
        }
      }
    });

    return { dates: datesResult, uniqueMonths: uniqueMonthList };
  }, [days, logMap]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800/50';
    if (count < 5) return 'bg-green-100 dark:bg-green-900/30';
    if (count < 15) return 'bg-green-300 dark:bg-green-700/60';
    if (count < 30) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-400';
  };

  return (
    <div className="w-full">
      <div className="flex">
        {/* Day labels (Mon, Wed, Fri) - perfectly aligned with 16px boxes + 4px gap */}
        <div className="hidden sm:flex flex-col text-[10px] text-gray-400 font-bold pr-3 mt-6">
          <div className="h-4 flex items-center">Mon</div>
          <div className="h-4 mt-1"></div> {/* Tue (gap-1 = mt-1) */}
          <div className="h-4 mt-1 flex items-center">Wed</div>
          <div className="h-4 mt-1"></div> {/* Thu */}
          <div className="h-4 mt-1 flex items-center">Fri</div>
          <div className="h-4 mt-1"></div> {/* Sat */}
          <div className="h-4 mt-1 flex items-center">Sun</div>
        </div>

        <div className="flex flex-col overflow-x-auto pb-4 flex-1 scrollbar-hide">
          <div className="min-w-max">
            {/* Month labels - aligned with week columns */}
            <div className="flex text-[10px] text-gray-400 font-bold mb-2 relative h-4 w-full uppercase tracking-tighter">
              {uniqueMonths.map((m, i) => (
                <span
                  key={i}
                  className="absolute whitespace-nowrap"
                  style={{ left: `calc(${m.index} * 1.25rem)` }}
                >
                  {m.month}
                </span>
              ))}
            </div>

            {/* Cells Grid */}
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {dates.map((item, i) => {
                if (!item) {
                  return <div key={`empty-${i}`} className="w-4 h-4" />;
                }
                const isToday = item.date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={item.date}
                    title={`${item.date}: ${item.details}`}
                    className={`w-4 h-4 rounded-[3px] border border-black/5 dark:border-white/5 transition-all hover:z-10 cursor-pointer ${
                      isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''
                    } ${getColorClass(item.count)}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <span className="hover:text-blue-500 transition-colors cursor-help">Learn how we count contributions</span>
        <div className="flex items-center gap-3">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 4, 14, 29, 50].map(c => (
              <div key={c} className={`w-3 h-3 rounded-[2px] ${getColorClass(c)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
