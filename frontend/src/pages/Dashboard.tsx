import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/useToast';
import { getDashboardData, type DashboardData } from '../services/dashboardApi';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

const performanceColors = ['bg-[#ff8c00]', 'bg-[#00e6e6]', 'bg-gray-600', 'bg-[#ffb067]'];

function Dashboard() {
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overviewRange, setOverviewRange] = useState<'3' | '6' | 'all'>('6');

  useEffect(() => {
    const carregarDashboard = async () => {
      try {
        const response = await getDashboardData();
        setDashboard(response);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast({
          tone: 'error',
          title: 'Nao consegui carregar o dashboard',
          description: 'Os blocos de metricas ficaram sem dados reais agora.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void carregarDashboard();
  }, [showToast]);

  const visibleMonthlyOverview = useMemo(() => {
    const monthlyOverview = dashboard?.sales.monthly_overview ?? [];

    if (overviewRange === 'all') {
      return monthlyOverview;
    }

    return monthlyOverview.slice(-Number(overviewRange));
  }, [dashboard?.sales.monthly_overview, overviewRange]);
  const monthlyLabels = visibleMonthlyOverview.map((item) => `${item.label}: ${formatCurrency(item.value)}`);
  const teamPerformance = dashboard?.team_performance ?? [];
  const recentActivities = useMemo(() => dashboard?.recent_activities ?? [], [dashboard]);
  const paidRevenue = dashboard?.financial.revenue ?? 0;
  const paidExpenses = dashboard?.financial.expenses ?? 0;
  const balance = dashboard?.financial.balance ?? 0;

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-gray-800 bg-[#23272d] p-8 text-gray-400 shadow-2xl">
        Carregando metricas reais do dashboard...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 bg-[#23272d] rounded-[32px] p-6 shadow-2xl relative h-72 flex flex-col justify-between overflow-hidden group">
        <div className="flex justify-between z-10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Visão Geral Mensal</p>
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-[#1a1e23] p-1">
              {[
                { value: '3', label: '3 meses' },
                { value: '6', label: '6 meses' },
                { value: 'all', label: 'Tudo' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setOverviewRange(option.value as '3' | '6' | 'all')}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition ${
                    overviewRange === option.value ? 'bg-cyan-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
              {monthlyLabels.length > 0 ? (
                monthlyLabels.map((item) => <span key={item}>{item}</span>)
              ) : (
                <span>Sem dados mensais ainda</span>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 top-1/3 opacity-70 flex items-end">
          <svg viewBox="0 0 1000 300" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mount1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818ea1" />
                <stop offset="100%" stopColor="#1a1e23" />
              </linearGradient>
              <linearGradient id="mount2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffb067" />
                <stop offset="100%" stopColor="#1a1e23" />
              </linearGradient>
            </defs>
            <path d="M0,300 L0,200 L150,100 L300,180 L450,80 L650,220 L800,120 L1000,250 L1000,300 Z" fill="url(#mount1)" opacity="0.6" />
            <path d="M400,300 L550,150 L650,50 L750,180 L850,220 L1000,200 L1000,300 Z" fill="url(#mount2)" opacity="0.8" />
            <path d="M0,150 Q100,120 200,180 T400,100 T600,60 T800,120 T1000,40" fill="none" stroke="#e0e0e0" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
        </div>
      </div>

      <div className="lg:col-span-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PortfolioStatCard
          label="Receita paga"
          value={formatCurrency(paidRevenue)}
          helper="Tudo que ja entrou no caixa"
          tone="emerald"
        />
        <PortfolioStatCard
          label="Despesa paga"
          value={formatCurrency(paidExpenses)}
          helper="Tudo que ja saiu do caixa"
          tone="red"
        />
        <PortfolioStatCard
          label="Saldo atual"
          value={formatCurrency(balance)}
          helper="Resultado liquido do periodo"
          tone={balance >= 0 ? 'cyan' : 'orange'}
        />
        <PortfolioStatCard
          label="Usuarios ativos"
          value={String(dashboard?.users.active ?? 0)}
          helper="Pessoas usando o sistema"
          tone="slate"
        />
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-[#23272d] rounded-[32px] p-6 shadow-xl flex-1 flex flex-col justify-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Taxa de Conversão</p>
          <div className="flex items-end justify-between">
            <h2 className="text-4xl font-light text-white tracking-tighter">
              {dashboard?.leads.conversion_rate?.toFixed(2) ?? '0.00'}%
            </h2>
            <h2 className="text-3xl font-light text-gray-400">{dashboard?.leads.total ?? 0}</h2>
          </div>
        </div>

        <div className="bg-[#23272d] rounded-[32px] p-6 shadow-xl flex-1 flex flex-col justify-center relative overflow-hidden">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Produtos em Baixo Estoque</p>
          <div className="flex items-end justify-between z-10">
            <h2 className="text-4xl font-bold text-white tracking-tighter">{dashboard?.products.low_stock ?? 0}</h2>
            <h2 className="text-2xl font-light text-gray-400">de {dashboard?.products.total ?? 0}</h2>
          </div>
          <div className="absolute right-[-20%] bottom-[-50%] w-48 h-48 bg-[#00e6e6] opacity-10 blur-[50px] rounded-full"></div>
        </div>
      </div>

      <div className="lg:col-span-4 bg-[#23272d] rounded-[32px] p-6 shadow-xl relative h-64">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Receita / Custos</p>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#1a1e23] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Receitas pagas</p>
            <p className="mt-2 text-2xl font-black text-emerald-400">{formatCurrency(dashboard?.financial.revenue ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#1a1e23] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Despesas pagas</p>
            <p className="mt-2 text-2xl font-black text-red-400">{formatCurrency(dashboard?.financial.expenses ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 bg-[#23272d] rounded-[32px] p-6 shadow-xl flex flex-col items-center justify-center relative">
        <div className="w-40 h-40 relative">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2a3038" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ff8c00" strokeWidth="3" strokeDasharray={`${Math.min(dashboard?.leads.conversion_rate ?? 0, 100)}, 100`} />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00e6e6" strokeWidth="3" strokeDasharray={`${Math.min((dashboard?.users.active ?? 0) * 10, 100)}, 100`} strokeDashoffset={`-${Math.min(dashboard?.leads.conversion_rate ?? 0, 100)}`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-light text-white">{formatCurrency(dashboard?.financial.balance ?? 0)}</span>
            <span className="text-[10px] text-gray-500 uppercase mt-1">Saldo</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 bg-[#23272d] rounded-[32px] p-6 shadow-xl flex flex-col justify-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">Desempenho da Equipe</p>
        <div className="space-y-4">
          {teamPerformance.length > 0 ? (
            teamPerformance.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center space-x-4">
                <span className="text-xs text-gray-400 w-20 truncate">{item.name}</span>
                <div className="flex-1 bg-[#1a1e23] h-1.5 rounded-full overflow-hidden">
                  <div className={`${performanceColors[index % performanceColors.length]} h-full`} style={{ width: `${item.val}%` }}></div>
                </div>
                <span className="text-xs text-gray-500">{item.val}%</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Sem dados de desempenho ainda.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-12 bg-[#23272d] rounded-[32px] p-6 shadow-xl">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">Atividades Recentes</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-white/5 bg-[#1a1e23] p-4">
                <p className="text-sm font-bold text-white">{activity.text}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">{activity.type}</p>
                <p className="mt-3 text-xs text-gray-400">{activity.time}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#1a1e23] p-4 text-sm text-gray-500">
              Ainda nao existem atividades para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

function PortfolioStatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'emerald' | 'red' | 'cyan' | 'orange' | 'slate';
}) {
  const toneClasses: Record<typeof tone, string> = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
    red: 'border-red-500/20 bg-red-500/5 text-red-300',
    cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300',
    orange: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
    slate: 'border-white/10 bg-[#1a1e23] text-slate-200',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-xl ${toneClasses[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.25em]">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}
