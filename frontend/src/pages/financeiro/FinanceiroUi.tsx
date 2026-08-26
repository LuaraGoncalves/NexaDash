export function StatCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: 'green' | 'red';
}) {
  return (
    <div className="bg-[#23272d] rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden">
      <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">{title}</h3>
      <p className="text-3xl font-black text-white relative z-10">{value}</p>
      <p className={`text-xs mt-2 relative z-10 ${tone === 'green' ? 'text-yellow-500' : 'text-yellow-500'}`}>{helper}</p>
    </div>
  );
}

export function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#00e6e6]"
      />
    </div>
  );
}

export function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-gray-800 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? 'text-white font-bold' : 'text-white'}>{value}</span>
    </div>
  );
}
