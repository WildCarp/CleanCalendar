import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled }) => {
  return (
    <div
      className={`w-[30px] h-[18px] rounded-cc-full relative cursor-pointer transition-colors duration-150 border border-transparent box-border
        ${checked ? 'bg-[var(--switch-on)]' : 'bg-cc-border-default'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div
        className="absolute top-[1px] w-[14px] h-[14px] rounded-cc-full bg-white transition-transform duration-150"
        style={{
          left: checked ? 'calc(100% - 15px)' : '1px',
        }}
      />
    </div>
  );
};
