<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientDeviceToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'push_token',
        'platform',
        'device_name',
        'last_active_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * Associated user account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Associated corporate client profile if resolved.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Upsert a push token for an authenticated user.
     */
    public static function registerToken(
        User $user,
        string $token,
        string $platform = 'android',
        ?string $deviceName = null,
        ?int $clientId = null
    ): self {
        if (!$clientId) {
            $clientId = Client::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->value('id');
        }

        return self::updateOrCreate(
            ['push_token' => $token],
            [
                'user_id' => $user->id,
                'client_id' => $clientId,
                'platform' => strtolower($platform) === 'ios' ? 'ios' : 'android',
                'device_name' => $deviceName,
                'last_active_at' => now(),
            ]
        );
    }

    /**
     * Remove / prune a specific push token.
     */
    public static function removeToken(string $token, ?int $userId = null): int
    {
        $query = self::where('push_token', $token);
        if ($userId) {
            $query->where('user_id', $userId);
        }
        return $query->delete();
    }
}
