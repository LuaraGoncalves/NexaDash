<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    public const STATUS_NOVO = 'novo';

    public const STATUS_NEGOCIACAO = 'negociacao';

    public const STATUS_INDECISO = 'indeciso';

    public const STATUS_AGUARDANDO = 'aguardando';

    public const STATUS_CONCLUIDO = 'concluido';

    public const STATUS_OPTIONS = [
        self::STATUS_NOVO,
        self::STATUS_NEGOCIACAO,
        self::STATUS_INDECISO,
        self::STATUS_AGUARDANDO,
        self::STATUS_CONCLUIDO,
    ];

    protected $fillable = [
        'name',
        'phone',
        'email',
        'status',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(LeadMessage::class)->orderBy('sent_at');
    }
}
