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
    ring: 'border-[#e5c6c6]',
    icon: 'bg-[#fbefef] text-[#9f2d2d] border-[#e5c6c6]',
    confirm: 'bg-[#9f2d2d] text-white hover:bg-[#7f2424] disabled:bg-[#d8b5b5]',
  },
  warning: {
    ring: 'border-[#ead3ad]',
    icon: 'bg-[#fff7e8] text-[#9a5b17] border-[#ead3ad]',
    confirm: 'bg-[#9a5b17] text-white hover:bg-[#784611] disabled:bg-[#dfc49c]',
  },
  info: {
    ring: 'border-[#b7cbbd]',
    icon: 'bg-[#eaf2ec] text-[#214e39] border-[#b7cbbd]',
    confirm: 'bg-[#2f6f4e] text-white hover:bg-[#214e39] disabled:bg-[#b7cbbd]',
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#20242c]/45 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-[1.5rem] border bg-[#fffdfa] shadow-[0_24px_60px_rgba(56,50,43,0.2)] ${currentTone.ring}`}>
        <div className="border-b border-[#ded6c9] px-6 py-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${currentTone.icon}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#20242c]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#766f66]">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-2 text-sm font-medium text-[#766f66] transition hover:border-[#c9beaf] hover:text-[#20242c]"
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${currentTone.confirm}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
