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

const showLocalAccountShortcuts = import.meta.env.DEV;
const defaultLocalAccount = showLocalAccountShortcuts ? localAccounts[0] : null;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(defaultLocalAccount?.email ?? '');
  const [password, setPassword] = useState(defaultLocalAccount?.password ?? '');
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
    <div className="nexa-ui min-h-screen bg-[#d8d2c8] px-4 py-6 text-[#20242c]">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] shadow-[0_30px_80px_rgba(56,50,43,0.16)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden border-r border-[#eee6da] bg-[#f6f1e8] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#20242c] text-lg font-semibold text-[#f6d957]">
              N
            </div>
            <h1 className="mt-6 text-3xl font-semibold">NexaDash</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#766f66]">
              CRM comercial com PDV, financeiro, leads, clientes e estoque em uma operação só.
            </p>
          </div>

          {showLocalAccountShortcuts ? (
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
                  className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-3 text-left transition hover:border-[#c9beaf] hover:bg-[#eee8de]"
                >
                  <p className="text-sm font-semibold text-[#20242c]">{account.label}</p>
                  <p className="mt-1 text-xs text-[#766f66]">{account.email}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#ded6c9] bg-[#fffdfa] p-5">
              <p className="text-sm font-semibold text-[#20242c]">Acesso seguro</p>
              <p className="mt-2 text-sm leading-6 text-[#766f66]">
                Entre com a conta cadastrada pelo administrador do sistema.
              </p>
            </div>
          )}
        </section>

        <main className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#20242c] font-semibold text-[#f6d957]">
                N
              </div>
              <h1 className="mt-4 text-3xl font-semibold">NexaDash</h1>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-semibold">Entrar no sistema</h2>
              <p className="mt-2 text-sm text-[#766f66]">Use uma conta local para acessar o painel do cargo.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#20242c]">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-3 text-[#20242c] outline-none transition focus:border-[#f6d957]"
                  placeholder="seuemail@empresa.com"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-medium text-[#20242c]">Senha</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-sm font-medium text-[#9a5b17] hover:text-[#20242c]"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#ded6c9] bg-[#fffdfa] px-4 py-3 text-[#20242c] outline-none transition focus:border-[#f6d957]"
                  placeholder="Sua senha"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-[#e5c6c6] bg-[#fbefef] px-4 py-3 text-sm text-[#9f2d2d]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#20242c] px-4 py-3 font-semibold text-[#fffdfa] transition hover:bg-[#171a20] disabled:bg-[#c9beaf] disabled:text-[#766f66]"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {showLocalAccountShortcuts && (
              <div className="mt-7 grid gap-2 lg:hidden">
                {localAccounts.map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setError('');
                    }}
                    className="rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] px-4 py-3 text-left"
                  >
                    <p className="text-sm font-semibold text-[#20242c]">{account.label}</p>
                    <p className="mt-1 text-xs text-[#766f66]">{account.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
