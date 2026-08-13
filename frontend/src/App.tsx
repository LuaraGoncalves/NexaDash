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
  const canViewLeads = Boolean(permissions.ver_leads);
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
    <div className="flex h-screen bg-[#1c2128] text-gray-300 font-sans overflow-hidden">
      
      {/* Sidebar Light */}
      <aside className="w-[300px] bg-[#f8f9fc] flex flex-col justify-between py-10 shadow-2xl z-20 rounded-r-[40px] relative">
        <div className="px-8">
          <Link to={homeRoute} className="flex items-center space-x-3 mb-16 cursor-pointer group">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-black group-hover:scale-110 transition-transform"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5H5.5L12 6.5z"/></svg>
            </div>
            <span className="font-semibold text-sm tracking-[0.2em] text-gray-800 uppercase group-hover:text-black transition-colors">Nexa</span>
          </Link>

          <div className="mb-10">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-6 px-2">Menu Principal</p>
            <div className="space-y-6">
               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 px-2 mt-8">Navegação</p>
               <nav className="space-y-4">
                  {navigationItems.map((item, index) => (
                    <Link key={item.to} to={item.to} className={`relative flex items-center justify-between group cursor-pointer px-2 ${item.active ? '' : 'opacity-50'}`}>
                      <span className={`text-sm font-bold ${item.active ? 'text-gray-800' : 'text-gray-500'}`}>{index + 1}. {item.label}</span>
                      {item.to === '/crm/leads' && (
                        <span className="absolute top-1/2 -translate-y-1/2 left-[88px] flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                    </Link>
                  ))}
               </nav>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Dark Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#1a1e23] to-[#262c35] p-10 relative">
        
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center space-x-4">
             <h1 className="text-lg font-bold text-gray-200 tracking-wider">MÉTRICAS DO NEGÓCIO</h1>
             <span className="text-xs text-gray-500 border border-gray-600 px-2 py-0.5 rounded-full">Atualizado</span>
             <ContextHelp title="Como usar o painel">
               <p>Use a barra lateral para entrar apenas nos módulos liberados para o seu cargo.</p>
               <p>O botão PDV aparece para quem pode vender. Financeiro fica focado no fluxo financeiro.</p>
             </ContextHelp>
          </div>
          <div className="flex items-center space-x-6">
            {canUseSales && (
              <Link to="/crm/vendas" className="bg-[#00e6e6] text-[#1a1e23] px-4 py-1.5 rounded-full text-xs font-black transition hover:scale-[1.02]">
                PDV
              </Link>
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">{user?.name}</span>
              <button onClick={handleLogout} className="text-xs text-[#ff8c00] hover:text-orange-300">
                Sair
              </button>
            </div>
          </div>
        </header>

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
      </main>
    </div>
  );
}

export default App;
