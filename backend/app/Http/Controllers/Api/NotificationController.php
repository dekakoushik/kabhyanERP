<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get recent notifications and unread count for current user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SystemNotification::query();

        if (in_array($user->role, ['superadmin', 'admin'])) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereNull('user_id');
            });
        } else {
            $query->where('user_id', $user->id);
        }

        $unreadCount = (clone $query)->where('is_read', false)->count();

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'unread_count' => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $notification = SystemNotification::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id);
                if (in_array($user->role, ['superadmin', 'admin'])) {
                    $q->orWhereNull('user_id');
                }
            })
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read for current user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        SystemNotification::markAllAsReadForUser($user);

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete notification.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $notification = SystemNotification::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id);
                if (in_array($user->role, ['superadmin', 'admin'])) {
                    $q->orWhereNull('user_id');
                }
            })
            ->firstOrFail();

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully',
        ]);
    }
}
