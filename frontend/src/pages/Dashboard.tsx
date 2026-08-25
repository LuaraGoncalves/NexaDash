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

  const highestMonthlyValue = Math.max(...visibleMonthlyOverview.map((item) => item.value), 1);
  const teamPerformance = dashboard?.team_performance ?? [];
  const recentActivities = dashboard?.recent_activities ?? [];
  const paidRevenue = dashboard?.financial.revenue ?? 0;
  const paidExpenses = dashboard?.financial.expenses ?? 0;
  const balance = dashboard?.financial.balance ?? 0;

  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] border border-[#ded6c9] bg-[#fffdfa] p-6 text-[#766f66] shadow-[0_18px_45px_rgba(56,50,43,0.08)]">
        Carregando métricas...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#20242c]">Visão geral</h2>
            <p className="mt-1 text-sm text-[#766f66]">Receita, conversão, estoque e atividades recentes.</p>
          </div>

          <div className="inline-flex w-fit rounded-2xl border border-[#ded6c9] bg-[#f6f1e8] p-1">
            {[
              { value: '3', label: '3 meses' },
              { value: '6', label: '6 meses' },
              { value: 'all', label: 'Tudo' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOverviewRange(option.value as '3' | '6' | 'all')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  overviewRange === option.value ? 'bg-[#20242c] text-[#fffdfa] shadow-sm' : 'text-[#766f66] hover:text-[#20242c]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Receita paga" value={formatCurrency(paidRevenue)} helper="Entradas confirmadas" tone="green" />
          <MetricCard label="Despesa paga" value={formatCurrency(paidExpenses)} helper="Saídas confirmadas" tone="red" />
          <MetricCard label="Saldo atual" value={formatCurrency(balance)} helper="Resultado financeiro" tone={balance >= 0 ? 'green' : 'amber'} />
          <MetricCard label="Usuários ativos" value={String(dashboard?.users.active ?? 0)} helper="Contas disponíveis" tone="neutral" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#20242c]">Receita mensal</h3>
              <p className="mt-1 text-sm text-[#766f66]">Vendas concluídas no período selecionado.</p>
            </div>
            <span className="text-sm font-medium text-[#766f66]">{dashboard?.sales.completed_count ?? 0} vendas</span>
          </div>

          <div className="mt-6 flex h-64 items-end gap-3 border-b border-[#ded6c9] pb-3">
            {visibleMonthlyOverview.length > 0 ? (
              visibleMonthlyOverview.map((item) => {
                const height = Math.max((item.value / highestMonthlyValue) * 100, item.value > 0 ? 8 : 2);

                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-48 w-full items-end rounded-xl bg-[#f6f1e8]">
                      <div
                        className="w-full rounded-xl bg-[#20242c] transition-[height]"
                        style={{ height: `${height}%` }}
                        title={`${item.label}: ${formatCurrency(item.value)}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#766f66]">{item.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#766f66]">
                Sem dados mensais ainda.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          <SmallPanel title="Leads" rows={[
            ['Novos', String(dashboard?.leads.new_leads ?? 0)],
            ['Conversão', `${dashboard?.leads.conversion_rate?.toFixed(2) ?? '0.00'}%`],
            ['Total', String(dashboard?.leads.total ?? 0)],
          ]} />

          <SmallPanel title="Estoque" rows={[
            ['Produtos', String(dashboard?.products.total ?? 0)],
            ['Baixo estoque', String(dashboard?.products.low_stock ?? 0)],
          ]} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.08)]">
          <h3 className="text-lg font-semibold text-[#20242c]">Equipe</h3>
          <div className="mt-5 space-y-4">
            {teamPerformance.length > 0 ? (
              teamPerformance.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-[#20242c]">{item.name}</span>
                    <span className="text-[#766f66]">{item.val}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f6f1e8]">
                    <div className="h-full rounded-full bg-[#f97316]" style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#766f66]">Sem dados de desempenho ainda.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.08)]">
          <h3 className="text-lg font-semibold text-[#20242c]">Atividades recentes</h3>
          <div className="mt-5 divide-y divide-[#ded6c9]">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-[#20242c]">{activity.text}</p>
                    <p className="mt-1 text-xs text-[#766f66]">{activity.type}</p>
                  </div>
                  <span className="text-xs font-medium text-[#766f66]">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[#766f66]">Ainda não existem atividades para mostrar.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'green' | 'red' | 'amber' | 'neutral';
}) {
  const toneClasses: Record<typeof tone, string> = {
    green: 'text-[#214e39]',
    red: 'text-[#9f2d2d]',
    amber: 'text-[#9a5b17]',
    neutral: 'text-[#20242c]',
  };

  return (
    <div className="rounded-[1.5rem] border border-[#eee6da] bg-[#f6f1e8] p-4">
      <p className="text-sm font-medium text-[#766f66]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-[#766f66]">{helper}</p>
    </div>
  );
}

function SmallPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-[2rem] border border-[#ded6c9] bg-[#fffdfa] p-5 shadow-[0_18px_45px_rgba(56,50,43,0.08)]">
      <h3 className="text-lg font-semibold text-[#20242c]">{title}</h3>
      <div className="mt-4 divide-y divide-[#ded6c9]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-[#766f66]">{label}</span>
            <span className="text-lg font-semibold text-[#20242c]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
