<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'action_url',
        'data',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Associated user if targeted.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Quick helper to record a new in-app notification.
     */
    public static function createNotification(
        ?int $userId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $data = []
    ): self {
        return self::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data,
            'is_read' => false,
        ]);
    }

    /**
     * Mark this notification as read.
     */
    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    /**
     * Mark all notifications for a given user as read.
     */
    public static function markAllAsReadForUser(User $user): void
    {
        self::where(function ($q) use ($user) {
            $q->where('user_id', $user->id);
            if (in_array($user->role, ['superadmin', 'admin'])) {
                $q->orWhereNull('user_id');
            }
        })
        ->where('is_read', false)
        ->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }
}

