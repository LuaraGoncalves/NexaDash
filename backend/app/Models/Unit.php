<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $fillable = [
        'sigla',
        'nome',
    ];

    public function produtos(): HasMany
    {
        return $this->hasMany(Product::class, 'id_unidade');
    }
}
