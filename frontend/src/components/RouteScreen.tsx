export default function RouteScreen({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-[#ded6c9] bg-[#fffdfa] text-sm font-medium text-[#766f66] shadow-[0_18px_40px_rgba(56,50,43,0.08)]">
      <span className="mr-3 h-2 w-2 rounded-full bg-[#f6d957]" />
      <span>{label}</span>
    </div>
  );
}
