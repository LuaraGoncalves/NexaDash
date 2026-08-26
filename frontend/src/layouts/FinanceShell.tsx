import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import RouteScreen from '../components/RouteScreen';
import { useAuth } from '../context/useAuth';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Financeiro = lazy(() => import('../pages/Financeiro'));

const navigationItems = [
  { to: '/crm/financeiro', label: 'Fluxo de caixa' },
  { to: '/crm', label: 'Indicadores' },
];

export default function FinanceShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname === '/' ? '/crm/financeiro' : location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="nexa-ui min-h-screen bg-[#d8d2c8] text-[#20242c]">
      <div className="mx-auto flex min-h-screen max-w-[1700px] flex-col gap-5 px-4 py-4 md:px-6">
        <header className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] px-5 py-4 shadow-[0_24px_70px_rgba(56,50,43,0.12)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Painel financeiro</h1>
              <p className="mt-1 text-sm text-[#766f66]">Fluxo de caixa e indicadores financeiros.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-2 text-sm font-medium text-[#766f66]">
                {user?.name} / financeiro
              </div>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-2 text-sm font-medium text-[#766f66] hover:border-[#c9beaf] hover:text-[#20242c]"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[250px_1fr]">
          <aside className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-3 shadow-[0_24px_70px_rgba(56,50,43,0.08)]">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = currentPath === item.to;

                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#20242c] text-[#fffdfa] shadow-[0_12px_30px_rgba(32,36,44,0.14)]'
                        : 'text-[#766f66] hover:bg-[#eee8de] hover:text-[#20242c]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-h-0 rounded-[2rem] border border-[#ded6c9] bg-[#f6f1e8] p-4 shadow-[0_24px_70px_rgba(56,50,43,0.12)] md:p-6">
            <Suspense fallback={<RouteScreen label="Carregando area financeira..." />}>
              <Routes>
                <Route path="/" element={<Navigate to="/crm/financeiro" replace />} />
                <Route path="/crm" element={<Dashboard />} />
                <Route path="/crm/financeiro" element={<Financeiro />} />
                <Route path="*" element={<Navigate to="/crm/financeiro" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
