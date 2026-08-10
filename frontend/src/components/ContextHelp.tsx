import { useEffect, useRef, useState } from 'react';

type ContextHelpProps = {
  title: string;
  children: React.ReactNode;
};

export default function ContextHelp({ title, children }: ContextHelpProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-black text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
      >
        i
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-gray-700 bg-[#111827] p-4 text-sm text-slate-200 shadow-2xl">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">{title}</p>
          <div className="space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
        </div>
      )}
    </div>
  );
}
