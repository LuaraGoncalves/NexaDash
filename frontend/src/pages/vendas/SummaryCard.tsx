type Props = {
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
};

export default function SummaryCard({ label, value, helper, highlight = false }: Props) {
  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-xl ${highlight ? 'border-cyan-500/30 bg-[#1d2630]' : 'border-gray-800 bg-[#23272d]'}`}>
      <p className={`text-[10px] uppercase tracking-[0.3em] ${highlight ? 'text-cyan-300' : 'text-gray-500'}`}>{label}</p>
      <p className={`mt-3 font-black ${highlight ? 'text-3xl text-[#00e6e6]' : 'text-lg text-white'}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-400">{helper}</p>
    </div>
  );
}
