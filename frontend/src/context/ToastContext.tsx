import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext, type ToastItem, type ToastTone } from './toast-context';

const toneStyles: Record<ToastTone, string> = {
  success: 'border-[#b7cbbd] bg-[#edf5ee] text-[#214e39]',
  error: 'border-[#e6b5ae] bg-[#fff0ee] text-[#9f2d2d]',
  info: 'border-[#ded6c9] bg-[#fffdfa] text-[#20242c]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);

    setToasts((prev) => [...prev, { ...toast, id }]);

    window.setTimeout(() => {
      removeToast(id);
    }, 4200);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[1.5rem] border px-4 py-4 shadow-[0_24px_60px_rgba(56,50,43,0.18)] backdrop-blur ${toneStyles[toast.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-full bg-[#20242c]/10 px-2 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#20242c]/80 transition hover:bg-[#20242c]/20"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
