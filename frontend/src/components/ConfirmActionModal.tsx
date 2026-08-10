type ConfirmActionModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'info';
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

const toneClasses = {
  danger: {
    ring: 'border-red-500/40',
    icon: 'bg-red-500/15 text-red-300 border-red-500/30',
    confirm: 'bg-red-500 text-white hover:bg-red-400 disabled:bg-red-900',
  },
  warning: {
    ring: 'border-amber-500/40',
    icon: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    confirm: 'bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:bg-amber-700',
  },
  info: {
    ring: 'border-cyan-500/40',
    icon: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    confirm: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:bg-cyan-700',
  },
} as const;

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Voltar',
  tone = 'danger',
  isSubmitting = false,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!isOpen) {
    return null;
  }

  const currentTone = toneClasses[tone];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-[1.75rem] border bg-[#23272d] shadow-2xl ${currentTone.ring}`}>
        <div className="border-b border-gray-700 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${currentTone.icon}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-700 bg-[#1a1e23] px-4 py-2 text-sm font-bold text-gray-300 transition hover:text-white"
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2 text-sm font-black transition ${currentTone.confirm}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
