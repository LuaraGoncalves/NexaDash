import { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ContextHelp from './components/ContextHelp';
import RouteScreen from './components/RouteScreen';
import { useAuth } from './context/useAuth';
import { getDefaultRouteForRole } from './services/authApi';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vendas = lazy(() => import('./pages/Vendas'));
const Users = lazy(() => import('./pages/Users'));
const Products = lazy(() => import('./pages/Products'));
const Leads = lazy(() => import('./pages/Leads'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Customers = lazy(() => import('./pages/Customers'));

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role ?? 'employee';
  const permissions = user?.permissions ?? {};
  const homeRoute = getDefaultRouteForRole(role);
  const canViewDashboard = role === 'admin' || role === 'manager' || role === 'finance';
  const canUseSales = role === 'admin' || role === 'manager';
  const canManageCatalog = role === 'admin' || role === 'manager';
  const canViewCustomers = role === 'admin' || role === 'manager';
  const canViewLeads = role === 'admin' || Boolean(permissions.ver_leads);
  const canViewFinance = role === 'admin' || Boolean(permissions.ver_financeiro);
  const canManageUsers = role === 'admin';

  const navigationItems = [
    { to: '/crm', label: 'Dashboard', visible: canViewDashboard, active: location.pathname === '/crm' || location.pathname === '/' },
    { to: '/crm/vendas', label: 'Vendas', visible: canUseSales, active: location.pathname === '/crm/vendas' },
    { to: '/crm/products', label: 'Produtos', visible: canManageCatalog, active: location.pathname === '/crm/products' },
    { to: '/crm/clientes', label: 'Clientes', visible: canViewCustomers, active: location.pathname === '/crm/clientes' },
    { to: '/crm/leads', label: 'Leads', visible: canViewLeads, active: location.pathname === '/crm/leads' },
    { to: '/crm/financeiro', label: 'Financeiro', visible: canViewFinance, active: location.pathname === '/crm/financeiro' },
    { to: '/crm/users', label: 'Usuários', visible: canManageUsers, active: location.pathname === '/crm/users' },
  ].filter((item) => item.visible);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="nexa-ui flex h-screen flex-col gap-5 overflow-auto bg-[#d8d2c8] p-4 text-[#20242c] lg:flex-row lg:overflow-hidden lg:p-5">
      <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] shadow-[0_24px_70px_rgba(56,50,43,0.12)] lg:w-[280px]">
        <div className="border-b border-[#eee6da] px-6 py-6">
          <Link to={homeRoute} className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#20242c] text-base font-semibold text-[#f6d957]">
              N
            </div>
            <div>
              <span className="block text-base font-semibold text-[#20242c]">NexaDash</span>
              <span className="text-xs text-[#766f66]">CRM comercial</span>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-between px-4 py-5">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-medium transition ${
                  item.active
                    ? 'bg-[#20242c] text-[#fffdfa] shadow-[0_12px_30px_rgba(32,36,44,0.16)]'
                    : 'text-[#766f66] hover:bg-[#eee8de] hover:text-[#20242c]'
                }`}
              >
                <span>{item.label}</span>
                {item.to === '/crm/leads' && <span className="h-2 w-2 rounded-full bg-[#9f2d2d]" />}
              </Link>
            ))}
          </nav>

          <div className="rounded-3xl border border-[#eee6da] bg-[#f6f1e8] p-4">
            <p className="text-sm font-medium text-[#20242c]">{user?.name}</p>
            <p className="mt-1 text-xs text-[#766f66]">{role}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-3 py-2 text-sm font-medium text-[#766f66] transition hover:border-[#c9beaf] hover:text-[#20242c]"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-[70vh] flex-1 overflow-y-auto rounded-[2rem] border border-[#ded6c9] bg-[#f6f1e8] shadow-[0_24px_70px_rgba(56,50,43,0.12)] lg:min-h-0">
        <header className="sticky top-0 z-20 border-b border-[#e7ded1] bg-[#f6f1e8]/95 px-8 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-[#20242c]">Operação comercial</h1>
                <p className="mt-1 text-sm text-[#766f66]">Indicadores, vendas, clientes e cadastros em um fluxo só.</p>
              </div>
              <ContextHelp title="Como usar o painel">
                <p>Use a barra lateral para entrar apenas nos módulos liberados para o seu cargo.</p>
                <p>O botão PDV aparece para quem pode vender. Financeiro fica focado no fluxo financeiro.</p>
              </ContextHelp>
            </div>

            <div className="flex items-center gap-3">
              {canUseSales && (
                <Link
                  to="/crm/vendas"
                  className="rounded-2xl bg-[#20242c] px-4 py-2 text-sm font-semibold text-[#fffdfa] transition hover:bg-[#171a20]"
                >
                  Abrir PDV
                </Link>
              )}
              <span className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-3 py-2 text-xs font-medium text-[#766f66]">
                Atualizado
              </span>
            </div>
          </div>
        </header>

        <div className="px-8 py-6">
          <Suspense fallback={<RouteScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to={homeRoute} replace />} />
              <Route path="/crm" element={canViewDashboard ? <Dashboard /> : <Navigate to={homeRoute} replace />} />
              <Route path="/crm/vendas" element={canUseSales ? <Vendas /> : <Navigate to={homeRoute} replace />} />
              <Route path="/crm/products" element={canManageCatalog ? <Products /> : <Navigate to={homeRoute} replace />} />
              <Route path="/crm/users" element={canManageUsers ? <Users /> : <Navigate to={homeRoute} replace />} />
              <Route path="/crm/leads" element={canViewLeads ? <Leads /> : <Navigate to={homeRoute} replace />} />
              <Route path="/crm/financeiro" element={canViewFinance ? <Financeiro /> : <Navigate to={homeRoute} replace />} />
              <Route path="/crm/clientes" element={canViewCustomers ? <Customers /> : <Navigate to={homeRoute} replace />} />
              <Route path="*" element={<Navigate to={homeRoute} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
