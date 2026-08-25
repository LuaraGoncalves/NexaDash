import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getDefaultRouteForRole } from '../services/authApi';

const localAccounts = [
  { label: 'Admin', email: 'admin@nexadash.local', password: 'password' },
  { label: 'Gerente', email: 'gerente@nexadash.local', password: 'password' },
  { label: 'Financeiro', email: 'financeiro@nexadash.local', password: 'password' },
  { label: 'Caixa', email: 'caixa@nexadash.local', password: 'password' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nexadash.local');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(135deg,_#0f141a,_#111827_45%,_#0b1120)] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden border-r border-white/10 bg-[linear-gradient(180deg,_rgba(34,211,238,0.08),_rgba(15,23,42,0.4))] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">NexaDash CRM</p>
            <h1 className="mt-5 text-4xl font-black leading-tight">CRM comercial com PDV e financeiro em um so fluxo</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
              Entre com um dos perfis locais para testar como cada cargo enxerga uma parte diferente do sistema.
            </p>
          </div>

          <div className="grid gap-3">
            {localAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setError('');
                }}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-cyan-400/50 hover:bg-white/10"
              >
                <p className="text-sm font-black text-white">{account.label}</p>
                <p className="mt-1 text-xs text-slate-400">{account.email}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8 lg:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3">NexaDash CRM</p>
            <h1 className="text-3xl font-black leading-tight">Entrar no sistema</h1>
            <p className="text-sm text-slate-400 mt-2">Use sua conta para acessar o painel certo para seu cargo.</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3">Area segura</p>
            <h2 className="text-3xl font-black leading-tight">Entrar no sistema</h2>
            <p className="text-sm text-slate-400 mt-2">Use sua conta para acessar o painel certo para seu cargo.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl bg-[#151b22] border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="seuemail@empresa.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Senha</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl bg-[#151b22] border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="Sua senha"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-100">
                <p className="font-black uppercase tracking-[0.2em] text-red-200">Nao consegui entrar</p>
                <p className="mt-2 text-red-100/90">{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-[#0f141a] transition hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#11161c] p-4 text-sm text-slate-400 lg:hidden">
            <p className="font-semibold text-slate-200 mb-3">Perfis locais</p>
            <div className="grid gap-2">
              {localAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setError('');
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-cyan-400/50"
                >
                  <p className="font-bold text-slate-200">{account.label}</p>
                  <p className="text-xs">{account.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
