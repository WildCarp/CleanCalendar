import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  width = '480px',
}) => {
  useEffect(() => {
    if (open) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.15)] dark:bg-[rgba(0,0,0,0.6)] z-[100]"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110]
          bg-cc-surface border border-cc-border-default rounded-cc-xl shadow-surface-dark"
        style={{ width }}
      >
        {title && (
          <div className="px-4 py-3 border-b border-cc-border-subtle">
            <h1 className="text-h2 text-cc-text-primary">{title}</h1>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
};
