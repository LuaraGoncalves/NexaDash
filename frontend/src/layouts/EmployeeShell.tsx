import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import EmployeeLeads from '../pages/EmployeeLeads';
import EmployeePdv from '../pages/EmployeePdv';
import { useAuth } from '../context/useAuth';

export default function EmployeeShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canViewLeads = Boolean(user?.permissions?.ver_leads);

  const currentPath = location.pathname.startsWith('/crm/leads') ? 'leads' : 'pdv';

  return (
    <div className="nexa-ui flex min-h-screen flex-col bg-[#d8d2c8] p-4 text-[#20242c]">
      <header className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] px-4 py-4 shadow-[0_24px_70px_rgba(56,50,43,0.12)] md:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Atendimento rápido</h1>
            <p className="mt-1 text-sm text-[#766f66]">PDV e leads em modo balcão.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-sm font-medium text-[#766f66]">
              {user?.name} / {user?.role}
            </div>
            <button
              onClick={() => navigate('/crm/vendas')}
              className={`min-w-[160px] rounded-lg px-5 py-4 text-base font-semibold transition ${
                currentPath === 'pdv'
                  ? 'bg-[#20242c] text-[#fffdfa]'
                  : 'border border-[#ded6c9] bg-[#fffdfa] text-[#20242c] hover:bg-[#eee8de]'
              }`}
            >
              Abrir PDV
            </button>
            {canViewLeads && (
              <button
                onClick={() => navigate('/crm/leads')}
                className={`min-w-[160px] rounded-lg px-5 py-4 text-base font-semibold transition ${
                  currentPath === 'leads'
                    ? 'bg-[#20242c] text-[#fffdfa]'
                    : 'border border-[#ded6c9] bg-[#fffdfa] text-[#20242c] hover:bg-[#eee8de]'
                }`}
              >
                Abrir Leads
              </button>
            )}
            <button
              onClick={() => logout()}
              className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-5 py-4 text-base font-semibold text-[#766f66] hover:border-[#c9beaf] hover:text-[#20242c]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-[#ded6c9] bg-[#f6f1e8] shadow-[0_24px_70px_rgba(56,50,43,0.12)]">
        <div className="h-full overflow-hidden">
          <Routes>
            <Route path="/crm/vendas" element={<EmployeePdv />} />
            <Route path="/crm/leads" element={canViewLeads ? <EmployeeLeads /> : <Navigate to="/crm/vendas" replace />} />
            <Route path="*" element={<Navigate to="/crm/vendas" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
