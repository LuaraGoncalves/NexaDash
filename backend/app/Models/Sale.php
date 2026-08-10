<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    public const STATUS_ABERTA = 'Aberta';
    public const STATUS_CONCLUIDA = 'Concluída';
    public const STATUS_CANCELADA = 'Cancelada';

    public const STATUS_OPTIONS = [
        self::STATUS_ABERTA,
        self::STATUS_CONCLUIDA,
        self::STATUS_CANCELADA,
    ];

    protected $fillable = [
        'protocolo',
        'id_cliente',
        'cliente_nome',
        'data_hora',
        'total',
        'forma_pagamento',
        'status',
        'itens',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'itens' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'id_cliente');
    }
}
