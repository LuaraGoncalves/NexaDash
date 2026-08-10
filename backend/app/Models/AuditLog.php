<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'usuario_nome',
        'modulo',
        'acao',
        'data_hora',
        'metadata',
    ];

    protected $casts = [
        'data_hora' => 'datetime',
        'metadata' => 'array',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public static function record(
        ?int $userId,
        string $usuarioNome,
        string $modulo,
        string $acao,
        array $metadata = []
    ): self {
        return self::create([
            'user_id' => $userId,
            'usuario_nome' => $usuarioNome,
            'modulo' => $modulo,
            'acao' => $acao,
            'data_hora' => now(),
            'metadata' => $metadata,
        ]);
    }
}
