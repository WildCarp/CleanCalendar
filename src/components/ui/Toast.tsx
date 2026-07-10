import React from 'react';
import { useUIStore } from '../../stores/useUIStore';

const typeIcons: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-enter pointer-events-auto bg-cc-surface border border-cc-border-default
            rounded-cc-lg shadow-surface-dark px-4 py-[10px] text-body-em text-cc-text-primary
            flex items-center gap-2 max-w-[360px]"
        >
          <span>{typeIcons[toast.type] || 'ℹ️'}</span>
          <span>{toast.message}</span>
          <button
            className="ml-2 text-cc-text-tertiary hover:text-cc-text-primary cursor-pointer bg-transparent border-none text-[14px]"
            onClick={() => removeToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
