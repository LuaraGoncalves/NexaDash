<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    public const STATUS_ATIVO = 'ativo';
    public const STATUS_INATIVO = 'inativo';

    protected $fillable = [
        'nome',
        'cnpj_cpf',
        'contato',
        'status',
    ];

    public function produtos(): HasMany
    {
        return $this->hasMany(Product::class, 'id_fornecedor');
    }
}
