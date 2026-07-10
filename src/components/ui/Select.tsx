import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showColorDot?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择',
  showColorDot = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`custom-select relative w-full ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="w-full px-[10px] pr-[28px] py-[6px] text-body bg-cc-surface text-cc-text-primary
          border border-cc-border-default rounded-cc-lg cursor-pointer text-left
          hover:border-cc-border-strong transition-colors duration-120 relative select-none"
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            {showColorDot && selected.color && (
              <span className="w-2 h-2 rounded-cc-full flex-shrink-0 inline-block" style={{ background: selected.color }} />
            )}
            {selected.label}
          </span>
        ) : (
          <span className="text-cc-text-tertiary">{placeholder}</span>
        )}
        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-cc-text-tertiary text-[10px] transition-transform duration-180 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-cc-surface border border-cc-border-strong
          rounded-cc-lg overflow-hidden z-[200] shadow-surface-dark dark:shadow-none">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-[10px] py-[7px] text-body cursor-pointer transition-colors duration-80 flex items-center gap-2
                hover:bg-cc-surface-hover hover:text-cc-text-primary
                ${opt.value === value ? 'text-cc-text-primary font-[510]' : 'text-cc-text-secondary'}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {showColorDot && opt.color && (
                <span className="w-2 h-2 rounded-cc-full flex-shrink-0" style={{ background: opt.color }} />
              )}
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
