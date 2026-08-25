<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialTransaction extends Model
{
    public const TIPO_RECEITA = 'receita';

    public const TIPO_DESPESA = 'despesa';

    public const STATUS_PAGO = 'Pago';

    public const STATUS_PENDENTE = 'Pendente';

    public const STATUS_CANCELADO = 'Cancelado';

    public const TIPOS = [
        self::TIPO_RECEITA,
        self::TIPO_DESPESA,
    ];

    public const STATUS_OPTIONS = [
        self::STATUS_PAGO,
        self::STATUS_PENDENTE,
        self::STATUS_CANCELADO,
    ];

    protected $fillable = [
        'tipo',
        'descricao',
        'valor',
        'data_vencimento',
        'data_pagamento',
        'id_categoria',
        'forma_pagamento',
        'status',
        'protocolo_venda',
        'observacoes',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'data_vencimento' => 'date',
        'data_pagamento' => 'date',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(FinancialCategory::class, 'id_categoria');
    }
}
