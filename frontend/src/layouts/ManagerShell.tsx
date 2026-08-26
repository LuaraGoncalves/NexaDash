import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import RouteScreen from '../components/RouteScreen';
import { useAuth } from '../context/useAuth';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Vendas = lazy(() => import('../pages/Vendas'));
const Products = lazy(() => import('../pages/Products'));
const Customers = lazy(() => import('../pages/Customers'));
const Leads = lazy(() => import('../pages/Leads'));

export default function ManagerShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = user?.permissions ?? {};
  const canViewLeads = Boolean(permissions.ver_leads);
  const navigationItems = [
    { to: '/crm', label: 'Visao geral', visible: true },
    { to: '/crm/vendas', label: 'Vendas', visible: true },
    { to: '/crm/products', label: 'Produtos', visible: true },
    { to: '/crm/clientes', label: 'Clientes', visible: true },
    { to: '/crm/leads', label: 'Leads', visible: canViewLeads },
  ].filter((item) => item.visible);

  const currentPath = location.pathname === '/' ? '/crm' : location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="nexa-ui min-h-screen bg-[#d8d2c8] text-[#20242c]">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-5 px-4 py-4 md:px-6">
        <header className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] px-5 py-4 shadow-[0_24px_70px_rgba(56,50,43,0.12)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Painel comercial</h1>
              <p className="mt-1 text-sm text-[#766f66]">Dashboard, vendas, produtos, clientes e leads.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-2 text-sm font-medium text-[#766f66]">
                {user?.name} / gerente
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

        <div className="grid flex-1 gap-5 xl:grid-cols-[260px_1fr]">
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
            <Suspense fallback={<RouteScreen label="Carregando area comercial..." />}>
              <Routes>
                <Route path="/" element={<Navigate to="/crm" replace />} />
                <Route path="/crm" element={<Dashboard />} />
                <Route path="/crm/vendas" element={<Vendas />} />
                <Route path="/crm/products" element={<Products />} />
                <Route path="/crm/clientes" element={<Customers />} />
                <Route path="/crm/leads" element={canViewLeads ? <Leads /> : <Navigate to="/crm" replace />} />
                <Route path="*" element={<Navigate to="/crm" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
