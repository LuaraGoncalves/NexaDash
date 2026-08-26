<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    public const STATUS_ATIVO = 'ativo';

    public const STATUS_INATIVO = 'inativo';

    public const STATUS_OPTIONS = [
        self::STATUS_ATIVO,
        self::STATUS_INATIVO,
    ];

    protected $fillable = [
        'sku',
        'nome',
        'descricao',
        'preco_custo',
        'preco_venda',
        'quantidade',
        'estoque_minimo',
        'status',
        'id_categoria',
        'id_fornecedor',
        'id_unidade',
        'foto_url',
    ];

    protected $casts = [
        'preco_custo' => 'decimal:2',
        'preco_venda' => 'decimal:2',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'id_categoria');
    }

    public function fornecedor(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'id_fornecedor');
    }

    public function unidade(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'id_unidade');
    }

    public function movimentacoes(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'id_produto');
    }
}
