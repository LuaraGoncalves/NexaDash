import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import RouteScreen from '../components/RouteScreen';
import { useAuth } from '../context/useAuth';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Vendas = lazy(() => import('../pages/Vendas'));
const Products = lazy(() => import('../pages/Products'));
const Customers = lazy(() => import('../pages/Customers'));
const Leads = lazy(() => import('../pages/Leads'));

const navigationItems = [
  { to: '/crm', label: 'Visao geral' },
  { to: '/crm/vendas', label: 'Vendas' },
  { to: '/crm/products', label: 'Produtos' },
  { to: '/crm/clientes', label: 'Clientes' },
  { to: '/crm/leads', label: 'Leads' },
];

export default function ManagerShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname === '/' ? '/crm' : location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f4efe8] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-4 py-4 md:px-6">
        <header className="rounded-[2rem] bg-white px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#c46b2d]">Painel comercial</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Tudo da operaçao de vendas em um lugar</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                O gerente fica com o que ajuda a vender: dashboard, PDV, produtos, clientes e leads.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full bg-[#f8f1e8] px-4 py-3 text-sm font-bold text-[#8d5a2f]">
                {user?.name} • gerente
              </div>
              <button
                onClick={handleLogout}
                className="rounded-[1.25rem] border-2 border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:border-slate-300"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[2rem] bg-[#111827] p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cyan-300">Navegaçao</p>
            <div className="mt-5 space-y-3">
              {navigationItems.map((item) => {
                const isActive = currentPath === item.to;

                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`w-full rounded-[1.5rem] px-4 py-4 text-left text-base font-black transition ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.25)]'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-h-0 rounded-[2rem] bg-[#111827] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.15)] md:p-6">
            <Suspense fallback={<RouteScreen label="Carregando area comercial..." />}>
              <Routes>
                <Route path="/" element={<Navigate to="/crm" replace />} />
                <Route path="/crm" element={<Dashboard />} />
                <Route path="/crm/vendas" element={<Vendas />} />
                <Route path="/crm/products" element={<Products />} />
                <Route path="/crm/clientes" element={<Customers />} />
                <Route path="/crm/leads" element={<Leads />} />
                <Route path="*" element={<Navigate to="/crm" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
