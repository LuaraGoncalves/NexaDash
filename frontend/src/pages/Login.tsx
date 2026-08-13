import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getDefaultRouteForRole } from '../services/authApi';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nexadash.local');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#0f141a] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3">NexaDash CRM</p>
          <h1 className="text-3xl font-black leading-tight">Entrar no sistema</h1>
          <p className="text-sm text-slate-400 mt-2">Use sua conta para acessar o painel certo para seu cargo.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl bg-[#151b22] border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="seuemail@empresa.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl bg-[#151b22] border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Sua senha"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
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

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#11161c] p-4 text-sm text-slate-400">
          <p className="font-semibold text-slate-200 mb-2">Contas de teste</p>
          <p>Admin: admin@nexadash.local / password</p>
          <p>Gerente: gerente@nexadash.local / password</p>
          <p>Financeiro: financeiro@nexadash.local / password</p>
          <p>Caixa: caixa@nexadash.local / password</p>
        </div>
      </div>
    </div>
  );
}
