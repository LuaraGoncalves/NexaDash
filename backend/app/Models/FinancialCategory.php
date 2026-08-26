<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialCategory extends Model
{
    public const TIPO_RECEITA = 'receita';

    public const TIPO_DESPESA = 'despesa';

    public const TIPO_AMBOS = 'ambos';

    public const TIPOS = [
        self::TIPO_RECEITA,
        self::TIPO_DESPESA,
        self::TIPO_AMBOS,
    ];

    protected $fillable = [
        'nome',
        'tipo',
        'cor',
    ];

    public function transacoes(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class, 'id_categoria');
    }
}
