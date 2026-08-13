export default function RouteScreen({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#0f141a] text-white flex items-center justify-center">
      {label}
    </div>
  );
}
