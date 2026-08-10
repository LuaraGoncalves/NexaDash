import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import EmployeeLeads from '../pages/EmployeeLeads';
import EmployeePdv from '../pages/EmployeePdv';
import { useAuth } from '../context/AuthContext';

export default function EmployeeShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.startsWith('/crm/leads') ? 'leads' : 'pdv';

  return (
    <div className="min-h-screen bg-[#e5e7eb] text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] font-black text-slate-400">Modo Funcionaria</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Atendimento rapido</h1>
            <p className="mt-1 text-sm text-slate-500">
              Dois caminhos grandes: vender ou responder lead. O resto fica escondido para nao atrapalhar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
              {user?.name} • {user?.role}
            </div>
            <button
              onClick={() => navigate('/crm/vendas')}
              className={`min-w-[180px] rounded-[1.25rem] px-6 py-4 text-lg font-black transition ${
                currentPath === 'pdv'
                  ? 'bg-[#16a34a] text-white shadow-[0_12px_30px_rgba(22,163,74,0.25)]'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Abrir PDV
            </button>
            <button
              onClick={() => navigate('/crm/leads')}
              className={`min-w-[180px] rounded-[1.25rem] px-6 py-4 text-lg font-black transition ${
                currentPath === 'leads'
                  ? 'bg-[#2563eb] text-white shadow-[0_12px_30px_rgba(37,99,235,0.25)]'
                  : 'bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              Abrir Leads
            </button>
            <button
              onClick={() => logout()}
              className="rounded-[1.25rem] border-2 border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-600 hover:border-slate-300"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-hidden">
          <Routes>
            <Route path="/crm/vendas" element={<EmployeePdv />} />
            <Route path="/crm/leads" element={<EmployeeLeads />} />
            <Route path="*" element={<Navigate to="/crm/vendas" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
