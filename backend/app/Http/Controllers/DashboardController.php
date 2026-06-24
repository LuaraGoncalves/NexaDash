<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'sales' => [
                'total_revenue' => 24500,
                'performance' => [12, 19, 3, 5, 2, 3]
            ],
            'products' => [
                'total' => 120,
                'top_selling' => 'Produto A'
            ],
            'leads' => [
                'new_leads' => 124,
                'conversion_rate' => 15
            ],
            'financial' => [
                'balance' => 54000
            ],
            'recent_activities' => [
                ['id' => 1, 'text' => 'Novo produto adicionado', 'time' => 'Há 2 horas', 'type' => 'Produto'],
                ['id' => 2, 'text' => 'Venda realizada no valor de R$500', 'time' => 'Há 4 horas', 'type' => 'Vendas']
            ]
        ]);
    }
}