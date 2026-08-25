<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'setor',
        'permissions',
        'last_login_at',
        'api_token',
        'api_token_expires_at',
        'api_token_last_used_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'api_token_expires_at' => 'datetime',
            'api_token_last_used_at' => 'datetime',
            'permissions' => 'array',
            'password' => 'hashed',
        ];
    }

    public function issueApiToken(): string
    {
        $plainToken = Str::random(80);

        $this->forceFill([
            'api_token' => self::hashApiToken($plainToken),
            'api_token_expires_at' => now()->addHours((int) config('auth.api_token_lifetime_hours', 8)),
            'api_token_last_used_at' => null,
        ])->save();

        return $plainToken;
    }

    public function clearApiToken(): void
    {
        $this->forceFill([
            'api_token' => null,
            'api_token_expires_at' => null,
            'api_token_last_used_at' => null,
        ])->save();
    }

    public function markApiTokenUsed(): void
    {
        $this->forceFill([
            'api_token_last_used_at' => now(),
        ])->save();
    }

    public function apiTokenExpired(): bool
    {
        return $this->api_token_expires_at !== null && $this->api_token_expires_at->isPast();
    }

    public static function hashApiToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
