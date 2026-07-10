import React, { useState, useRef, useEffect } from 'react';
import { MONTH_NAMES, WEEKDAY_NAMES } from '../../utils/time';

interface DatePickerProps {
  value: string; // ISO 8601 "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const date = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateDate = (d: Date) => {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    onChange(iso);
  };

  const selectDay = (day: number) => {
    const d = new Date(date);
    d.setFullYear(viewYear, viewMonth, day);
    updateDate(d);
    // 不关闭弹窗，方便继续调整时间
  };

  const navMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const updateTime = (hours: number, minutes: number) => {
    const d = new Date(date);
    d.setHours(hours, minutes);
    updateDate(d);
  };

  // 构建日期网格
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const adjustedDow = startDow === 0 ? 6 : startDow - 1; // Mon=0

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const selStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const days: React.ReactNode[] = [];
  // 上月填充
  const prevLast = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = adjustedDow - 1; i >= 0; i--) {
    days.push(
      <button key={`prev-${i}`} className="date-picker-day other-month text-cc-text-disabled">
        {prevLast - i}
      </button>,
    );
  }
  // 当月
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dStr = `${viewYear}-${viewMonth}-${d}`;
    const isSel = dStr === selStr;
    const isToday = dStr === todayStr;
    days.push(
      <button
        key={d}
        className={`date-picker-day w-[28px] h-[28px] rounded-cc-md border-none bg-transparent text-[12px] font-[400] cursor-pointer font-sans flex items-center justify-center transition-all duration-80
          ${isSel ? 'bg-cc-text-primary text-cc-surface font-[590]' : ''}
          ${!isSel && isToday ? 'text-cc-text-primary font-[590]' : ''}
          ${!isSel && !isToday ? 'text-cc-text-secondary hover:bg-cc-surface-hover' : ''}`}
        onClick={() => selectDay(d)}
      >
        {d}
      </button>,
    );
  }
  // 下月填充
  const remaining = (7 - ((adjustedDow + lastDay.getDate()) % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push(
      <button key={`next-${i}`} className="date-picker-day other-month text-cc-text-disabled">
        {i}
      </button>,
    );
  }

  return (
    <div ref={ref} className={`date-picker relative ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary
          border border-cc-border-default rounded-cc-lg cursor-pointer text-left select-none
          hover:border-cc-border-strong transition-colors duration-120"
        onClick={() => {
          setOpen(!open);
          setViewYear(date.getFullYear());
          setViewMonth(date.getMonth());
        }}
      >
        {`${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-[236px] bg-cc-surface border border-cc-border-strong
          rounded-cc-lg p-[10px] z-[200] shadow-surface-dark">
          {/* 头部导航 */}
          <div className="flex items-center justify-between mb-2">
            <button
              className="w-[24px] h-[24px] rounded-cc-md border border-cc-border-default bg-transparent text-cc-text-tertiary cursor-pointer text-[12px] flex items-center justify-center font-sans hover:bg-cc-surface-hover hover:text-cc-text-primary"
              onClick={() => navMonth(-1)}
            >
              ◂
            </button>
            <span className="text-body-em text-cc-text-primary">
              {viewYear}年 {MONTH_NAMES[viewMonth]}
            </span>
            <button
              className="w-[24px] h-[24px] rounded-cc-md border border-cc-border-default bg-transparent text-cc-text-tertiary cursor-pointer text-[12px] flex items-center justify-center font-sans hover:bg-cc-surface-hover hover:text-cc-text-primary"
              onClick={() => navMonth(1)}
            >
              ▸
            </button>
          </div>

          {/* 星期 */}
          <div className="grid grid-cols-7 text-[10px] font-[590] text-cc-text-tertiary text-center mb-1">
            {['一', '二', '三', '四', '五', '六', '日'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-[2px]">
            {days}
          </div>

          {/* 时间输入 */}
          <div className="flex gap-[6px] mt-2 pt-2 border-t border-cc-border-subtle items-center">
            <input
              className="w-[48px] px-[6px] py-[4px] text-[12px] font-[400] font-sans bg-cc-canvas text-cc-text-primary border border-cc-border-default rounded-cc-md text-center outline-none focus:border-cc-border-accent"
              maxLength={2}
              value={String(date.getHours()).padStart(2, '0')}
              onChange={e => {
                const h = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                updateTime(h, date.getMinutes());
              }}
            />
            <span className="text-[13px] text-cc-text-tertiary">:</span>
            <input
              className="w-[48px] px-[6px] py-[4px] text-[12px] font-[400] font-sans bg-cc-canvas text-cc-text-primary border border-cc-border-default rounded-cc-md text-center outline-none focus:border-cc-border-accent"
              maxLength={2}
              value={String(date.getMinutes()).padStart(2, '0')}
              onChange={e => {
                const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                updateTime(date.getHours(), m);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
