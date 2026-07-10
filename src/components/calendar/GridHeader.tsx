import React from 'react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { addDays, formatDate, WEEKDAY_NAMES, MONTH_NAMES } from '../../utils/time';

export const GridHeader: React.FC = () => {
  const getVisibleDates = useCalendarStore(s => s.getVisibleDates);
  const displayDays = useCalendarStore(s => s.displayDays);
  const viewCenterDate = useCalendarStore(s => s.viewCenterDate);

  const dates = getVisibleDates();
  const today = new Date();
  const todayStr = formatDate(today);

  return (
    <>
      {/* 角落占位 */}
      <div className="bg-cc-grid-header border-b border-r border-cc-border-subtle sticky top-0 left-0 z-10 h-[40px]" />

      {/* 日期列头 */}
      {dates.map((dateStr, i) => {
        const d = new Date(dateStr + 'T00:00:00');
        const isToday = dateStr === todayStr;
        return (
          <div
            key={dateStr}
            className={`bg-cc-grid-header border-b border-r border-cc-border-subtle flex flex-col items-center justify-center px-1 py-[4px] h-[40px]
              text-label text-cc-text-tertiary uppercase tracking-[0.04em] sticky top-0 z-10
              ${isToday ? '!bg-cc-grid-today text-cc-accent' : ''}`}
          >
            {i === 0 || d.getDate() === 1 ? (
              <span className="text-[10px]">{MONTH_NAMES[d.getMonth()]}</span>
            ) : null}
            <span className={`text-[18px] font-[590] leading-none mb-px ${isToday ? 'text-cc-accent' : 'text-cc-text-primary'}`}>
              {d.getDate()}
            </span>
            <span>{WEEKDAY_NAMES[d.getDay()]}</span>
          </div>
        );
      })}
    </>
  );
};
