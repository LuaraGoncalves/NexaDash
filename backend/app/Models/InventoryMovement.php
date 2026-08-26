<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    public const TIPO_ENTRADA = 'entrada';

    public const TIPO_SAIDA = 'saida';

    public const TIPOS = [
        self::TIPO_ENTRADA,
        self::TIPO_SAIDA,
    ];

    protected $fillable = [
        'id_produto',
        'id_usuario',
        'tipo',
        'quantidade',
        'data_hora',
        'motivo',
        'responsavel',
    ];

    protected $casts = [
        'data_hora' => 'datetime',
    ];

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'id_produto');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}
