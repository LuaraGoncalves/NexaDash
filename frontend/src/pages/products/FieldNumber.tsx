type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function FieldNumber({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#1a1e23] border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-[#ff8c00]"
      />
    </div>
  );
}
