import React from 'react';

// 颜色梯度: 1=柔和绿 → 5=红
const DOT_COLORS = ['#5ea86a', '#9db040', '#e5a83e', '#f57c00', '#e5484d'];

interface DotRatingProps {
  value: number; // 1-5
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export const DotRating: React.FC<DotRatingProps> = ({ value, onChange, readonly }) => {
  const color = DOT_COLORS[value - 1] || DOT_COLORS[0];

  const handleClick = (val: number) => {
    if (readonly) return;
    onChange?.(val);
  };

  return (
    <div className="flex gap-[6px] items-center">
      {[1, 2, 3, 4, 5].map((val) => {
        const filled = val <= value;
        return (
          <button
            key={val}
            type="button"
            className="w-[20px] h-[20px] rounded-cc-full flex-shrink-0 p-0 cursor-pointer transition-all duration-120 box-border inline-flex items-center justify-center leading-none text-[0px]"
            style={{
              background: filled ? color : 'transparent',
              border: filled ? `1.5px solid ${color}` : '1.5px solid var(--border-strong)',
            }}
            onClick={() => handleClick(val)}
            title={`${val}`}
          >
            {val}
          </button>
        );
      })}
    </div>
  );
};
