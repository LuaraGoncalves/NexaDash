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
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ded6c9] bg-[#fffdfa] text-xs font-black text-[#20242c] shadow-sm transition hover:border-[#e7ca45] hover:bg-[#f6d957]"
      >
        i
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-[#ded6c9] bg-[#fffdfa] p-4 text-sm text-[#20242c] shadow-[0_24px_60px_rgba(56,50,43,0.18)]">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#9a5b17]">{title}</p>
          <div className="space-y-2 text-sm leading-relaxed text-[#766f66]">{children}</div>
        </div>
      )}
    </div>
  );
}
