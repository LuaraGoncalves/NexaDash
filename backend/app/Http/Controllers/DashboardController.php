<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\FinancialTransaction;
use App\Models\Lead;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $completedSales = Sale::query()
            ->where('status', Sale::STATUS_CONCLUIDA)
            ->get();

        $revenueByMonth = $completedSales
            ->map(function (Sale $sale) {
                try {
                    $date = Carbon::parse($sale->data_hora);
                } catch (\Throwable) {
                    $date = $sale->created_at ?? now();
                }

                return [
                    'month' => $date->format('Y-m'),
                    'value' => (float) $sale->total,
                ];
            })
            ->groupBy('month')
            ->map(fn ($sales) => (float) collect($sales)->sum('value'));

        $monthlyRevenue = collect(range(11, 0))
            ->map(function (int $monthsAgo) use ($revenueByMonth) {
                $date = now()->subMonths($monthsAgo);
                $monthKey = $date->format('Y-m');

                return [
                    'label' => strtoupper($date->translatedFormat('M')),
                    'value' => (float) ($revenueByMonth[$monthKey] ?? 0),
                ];
            })
            ->values();

        $totalLeads = Lead::count();
        $leadsConcluidos = Lead::where('status', Lead::STATUS_CONCLUIDO)->count();
        $conversionRate = $totalLeads > 0 ? round(($leadsConcluidos / $totalLeads) * 100, 2) : 0;

        $receitasPagas = (float) FinancialTransaction::query()
            ->where('tipo', FinancialTransaction::TIPO_RECEITA)
            ->where('status', FinancialTransaction::STATUS_PAGO)
            ->sum('valor');

        $despesasPagas = (float) FinancialTransaction::query()
            ->where('tipo', FinancialTransaction::TIPO_DESPESA)
            ->where('status', FinancialTransaction::STATUS_PAGO)
            ->sum('valor');

        $teamPerformance = AuditLog::query()
            ->selectRaw('usuario_nome, COUNT(*) as total')
            ->groupBy('usuario_nome')
            ->orderByDesc('total')
            ->limit(4)
            ->get()
            ->map(function ($row) {
                return [
                    'name' => $row->usuario_nome,
                    'val' => min(100, (int) $row->total * 20),
                ];
            })
            ->values();

        if ($teamPerformance->isEmpty()) {
            $teamPerformance = User::query()
                ->where('status', 'ativo')
                ->limit(4)
                ->get()
                ->map(fn (User $user) => [
                    'name' => $user->name,
                    'val' => 0,
                ])
                ->values();
        }

        return response()->json([
            'sales' => [
                'total_revenue' => (float) Sale::query()
                    ->where('status', Sale::STATUS_CONCLUIDA)
                    ->sum('total'),
                'completed_count' => Sale::where('status', Sale::STATUS_CONCLUIDA)->count(),
                'monthly_overview' => $monthlyRevenue,
            ],
            'products' => [
                'total' => Product::count(),
                'low_stock' => Product::query()
                    ->where('status', Product::STATUS_ATIVO)
                    ->whereColumn('quantidade', '<=', 'estoque_minimo')
                    ->count(),
            ],
            'leads' => [
                'new_leads' => Lead::where('status', Lead::STATUS_NOVO)->count(),
                'conversion_rate' => $conversionRate,
                'total' => $totalLeads,
            ],
            'financial' => [
                'revenue' => $receitasPagas,
                'expenses' => $despesasPagas,
                'balance' => $receitasPagas - $despesasPagas,
            ],
            'users' => [
                'active' => User::where('status', 'ativo')->count(),
            ],
            'team_performance' => $teamPerformance,
            'recent_activities' => AuditLog::query()
                ->latest('data_hora')
                ->limit(5)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'text' => $log->acao,
                    'time' => $log->data_hora?->format('Y-m-d H:i'),
                    'type' => $log->modulo,
                ]),
        ]);
    }
}
