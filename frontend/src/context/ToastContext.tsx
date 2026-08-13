import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext, type ToastItem, type ToastTone } from './toast-context';

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50',
  error: 'border-red-400/30 bg-red-500/15 text-red-50',
  info: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-50',
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
            className={`pointer-events-auto rounded-[1.5rem] border px-4 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.25)] backdrop-blur ${toneStyles[toast.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-full bg-black/10 px-2 py-1 text-xs font-black uppercase tracking-[0.2em] text-white/80 transition hover:bg-black/20"
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
