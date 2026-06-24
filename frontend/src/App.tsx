import { Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Leads from "./pages/Leads";
import Financeiro from "./pages/Financeiro";
import LeadsKanban from './pages/LeadsKanban';

function App() {
  const location = useLocation();
  return (
    <div className="flex h-screen bg-[#1c2128] text-gray-300 font-sans overflow-hidden">
      
      {/* Sidebar Light */}
      <aside className="w-[300px] bg-[#f8f9fc] flex flex-col justify-between py-10 shadow-2xl z-20 rounded-r-[40px] relative">
        <div className="px-8">
          <Link to="/" className="flex items-center space-x-3 mb-16 cursor-pointer group">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-black group-hover:scale-110 transition-transform"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5H5.5L12 6.5z"/></svg>
            </div>
            <span className="font-semibold text-sm tracking-[0.2em] text-gray-800 uppercase group-hover:text-black transition-colors">Nexa</span>
          </Link>

          <div className="mb-10">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-6 px-2">Menu Principal</p>
            <div className="space-y-6">
               {/* 13% Circle Chart on Sidebar */}
               <div className="flex flex-col items-center mb-8 relative">
                 <div className="w-32 h-32 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e8ec" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#252f3f" strokeWidth="4" strokeDasharray="13, 100" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="5, 100" strokeDashoffset="-13" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                       <span className="text-2xl font-bold text-gray-800">13%</span>
                    </div>
                 </div>
                 <div className="flex justify-between w-full mt-4 px-4">
                    <div className="text-center">
                       <p className="text-xl font-bold text-gray-800">3</p>
                       <p className="text-[10px] text-gray-400">Vendas</p>
                    </div>
                    <div className="text-center">
                       <p className="text-xl font-bold text-gray-800">15%</p>
                       <p className="text-[10px] text-gray-400">Meta</p>
                    </div>
                 </div>
               </div>

               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 px-2 mt-8">Navegação</p>
               <nav className="space-y-4">
                  <Link to="/vendas" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/vendas' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/vendas' ? 'text-gray-800' : 'text-gray-500'}`}>1. Vendas</span>
                     <span className="text-xs text-gray-400 group-hover:text-black">5</span>
                  </Link>
                  <Link to="/products" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/products' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/products' ? 'text-gray-800' : 'text-gray-500'}`}>2. Produtos</span>
                     <span className="text-xs text-gray-400">4</span>
                  </Link>
                  <Link to="/leads" className={`relative flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/leads' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/leads' ? 'text-gray-800' : 'text-gray-500'}`}>3. Leads</span>
                     <span className="text-xs text-gray-400">1</span>
                     <span className="absolute top-1/2 -translate-y-1/2 left-[70px] flex h-2.5 w-2.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                     </span>
                  </Link>
                  <Link to="/financeiro" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/financeiro' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/financeiro' ? 'text-gray-800' : 'text-gray-500'}`}>4. Financeiro</span>
                     <span className="text-xs text-gray-400">8</span>
                  </Link>
                  <Link to="/users" className={`flex items-center justify-between group cursor-pointer px-2 ${location.pathname === '/users' ? '' : 'opacity-50'}`}>
                     <span className={`text-sm font-bold ${location.pathname === '/users' ? 'text-gray-800' : 'text-gray-500'}`}>5. Usuários</span>
                     <span className="text-xs text-gray-400">3</span>
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
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex space-x-3">
              <span className="text-xs text-gray-400">1.50</span>
              <span className="text-xs text-gray-400">2.14</span>
              <span className="text-xs text-[#00e6e6]">4.20</span>
            </div>
            <div className="flex space-x-2">
               <button className="bg-[#00e6e6] text-[#00e6e6] bg-opacity-20 hover:bg-opacity-30 px-4 py-1.5 rounded-full text-xs font-bold transition">AÇÃO 1</button>
               <button className="bg-[#ff8c00] text-[#ff8c00] bg-opacity-20 hover:bg-opacity-30 px-4 py-1.5 rounded-full text-xs font-bold transition">AÇÃO 2</button>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/products" element={<Products />} />
          <Route path="/users" element={<Users />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/leads-kanban" element={<LeadsKanban />} />
         </Routes>
      </main>
    </div>
  );
}

export default App;
