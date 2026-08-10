import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Leads from "./pages/Leads";
import Financeiro from "./pages/Financeiro";
import Customers from "./pages/Customers";
import ContextHelp from "./components/ContextHelp";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#1c2128] text-gray-300 font-sans overflow-hidden">
      
      {/* Sidebar Light */}
      <aside className="w-[300px] bg-[#f8f9fc] flex flex-col justify-between py-10 shadow-2xl z-20 rounded-r-[40px] relative">
        <div className="px-8">
          <Link to="/crm" className="flex items-center space-x-3 mb-16 cursor-pointer group">
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
                  <Link to="/crm/vendas" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/crm/vendas' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/crm/vendas' ? 'text-gray-800' : 'text-gray-500'}`}>1. Vendas</span>
                  </Link>
                  <Link to="/crm/products" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/crm/products' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/crm/products' ? 'text-gray-800' : 'text-gray-500'}`}>2. Produtos</span>
                  </Link>
                  <Link to="/crm/clientes" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/crm/clientes' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/crm/clientes' ? 'text-gray-800' : 'text-gray-500'}`}>3. Clientes</span>
                  </Link>
                  <Link to="/crm/leads" className={`relative flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/crm/leads' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/crm/leads' ? 'text-gray-800' : 'text-gray-500'}`}>4. Leads</span>
                     <span className="absolute top-1/2 -translate-y-1/2 left-[70px] flex h-2.5 w-2.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                     </span>
                  </Link>
                  <Link to="/crm/financeiro" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/crm/financeiro' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/crm/financeiro' ? 'text-gray-800' : 'text-gray-500'}`}>5. Financeiro</span>
                  </Link>
                  <Link to="/crm/users" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/crm/users' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/crm/users' ? 'text-gray-800' : 'text-gray-500'}`}>6. Usuários</span>
                  </Link>
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
               <p>Use a barra lateral para entrar nos módulos do CRM.</p>
               <p>O botão PDV abre o fluxo de caixa rápido. Clientes e leads são módulos diferentes.</p>
             </ContextHelp>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/crm/vendas" className="bg-[#00e6e6] text-[#1a1e23] px-4 py-1.5 rounded-full text-xs font-black transition hover:scale-[1.02]">
              PDV
            </Link>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">{user?.name}</span>
              <button onClick={handleLogout} className="text-xs text-[#ff8c00] hover:text-orange-300">
                Sair
              </button>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crm" element={<Dashboard />} />
          <Route path="/crm/vendas" element={<Vendas />} />
          <Route path="/crm/products" element={<Products />} />
          <Route path="/crm/users" element={<Users />} />
          <Route path="/crm/leads" element={<Leads />} />
          <Route path="/crm/financeiro" element={<Financeiro />} />
          <Route path="/crm/clientes" element={<Customers />} />
         </Routes>
      </main>
    </div>
  );
}

export default App;
