<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    public const STATUS_ATIVO = 'ativo';
    public const STATUS_INATIVO = 'inativo';

    public const STATUS_OPTIONS = [
        self::STATUS_ATIVO,
        self::STATUS_INATIVO,
    ];

    protected $fillable = [
        'name',
        'phone',
        'email',
        'status',
        'notes',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'id_cliente');
    }
}
