import React from 'react';

type ButtonVariant = 'success' | 'danger' | 'ghost' | 'subtle' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  success:
    'bg-[rgba(39,166,68,0.12)] text-[#27a644] border border-[rgba(39,166,68,0.20)] rounded-cc-md px-[14px] py-[5px]',
  danger:
    'bg-[rgba(229,72,77,0.12)] text-[#e5484d] border border-[rgba(229,72,77,0.20)] rounded-cc-md px-[14px] py-[5px]',
  ghost:
    'bg-[var(--btn-ghost-bg)] text-cc-text-secondary border border-cc-border-default rounded-cc-md px-3 py-[5px]',
  subtle:
    'bg-transparent text-cc-text-tertiary rounded-cc-sm px-2 py-[3px]',
  icon: 'bg-transparent text-cc-text-tertiary rounded-cc-full w-[30px] h-[30px] p-0',
};

const hoverClasses: Record<ButtonVariant, string> = {
  success: 'hover:bg-[rgba(39,166,68,0.20)]',
  danger: 'hover:bg-[rgba(229,72,77,0.20)]',
  ghost: 'hover:bg-cc-surface-hover hover:text-cc-text-primary',
  subtle: 'hover:bg-cc-surface-hover hover:text-cc-text-secondary',
  icon: 'hover:bg-cc-surface-hover hover:text-cc-text-primary',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'ghost',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center gap-[6px] cursor-pointer transition-all duration-120 
        text-body-em active:scale-[0.97] select-none
        ${variantClasses[variant]} ${hoverClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
