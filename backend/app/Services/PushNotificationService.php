<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientDeviceToken;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send a push notification to all active devices registered to a Client.
     * Also saves an in-app SystemNotification record for portal display.
     */
    public static function sendToClient(
        Client $client,
        string $title,
        string $body,
        array $data = []
    ): bool {
        try {
            // 1. Resolve User account connected to Client
            $user = $client->relationLoaded('user') ? $client->user : $client->user()->first();
            if (!$user && $client->email) {
                $user = User::where('email', $client->email)->first();
            }

            // 2. Persist in-app notification if user resolved
            if ($user) {
                SystemNotification::createNotification(
                    $user->id,
                    $data['type'] ?? 'commercial',
                    $title,
                    $body,
                    $data['action_url'] ?? null,
                    $data
                );
            }

            // 3. Collect registered mobile push tokens
            $tokensQuery = ClientDeviceToken::query();
            if ($user) {
                $tokensQuery->where(function ($q) use ($user, $client) {
                    $q->where('user_id', $user->id)
                      ->orWhere('client_id', $client->id);
                });
            } else {
                $tokensQuery->where('client_id', $client->id);
            }

            $deviceTokens = $tokensQuery->pluck('push_token')->unique()->values()->all();

            if (empty($deviceTokens)) {
                return false;
            }

            return self::dispatchExpoPush($deviceTokens, $title, $body, $data);
        } catch (\Throwable $e) {
            Log::warning('[PushNotificationService] Failed to send push to client #' . $client->id . ': ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return false;
        }
    }

    /**
     * Send a push notification to all active devices registered to a User.
     */
    public static function sendToUser(
        User $user,
        string $title,
        string $body,
        array $data = []
    ): bool {
        try {
            // In-app notification
            SystemNotification::createNotification(
                $user->id,
                $data['type'] ?? 'system',
                $title,
                $body,
                $data['action_url'] ?? null,
                $data
            );

            $deviceTokens = ClientDeviceToken::where('user_id', $user->id)
                ->pluck('push_token')
                ->unique()
                ->values()
                ->all();

            if (empty($deviceTokens)) {
                return false;
            }

            return self::dispatchExpoPush($deviceTokens, $title, $body, $data);
        } catch (\Throwable $e) {
            Log::warning('[PushNotificationService] Failed to send push to user #' . $user->id . ': ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return false;
        }
    }

    /**
     * Dispatch formatted messages to the Expo Push Gateway.
     */
    private static function dispatchExpoPush(
        array $tokens,
        string $title,
        string $body,
        array $data = []
    ): bool {
        $messages = [];
        foreach ($tokens as $token) {
            // Expo push tokens start with ExponentPushToken[...] or ExpoPushToken[...]
            if (empty($token)) {
                continue;
            }

            $messages[] = [
                'to' => $token,
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'commercial_notifications',
                'data' => $data,
            ];
        }

        if (empty($messages)) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])->timeout(8)->post(self::EXPO_PUSH_URL, $messages);

            if ($response->successful()) {
                $result = $response->json();
                $tickets = $result['data'] ?? [];

                // Prune expired / unregistered tokens automatically
                foreach ($tickets as $index => $ticket) {
                    if (isset($ticket['status']) && $ticket['status'] === 'error') {
                        $errorCode = $ticket['details']['error'] ?? '';
                        if ($errorCode === 'DeviceNotRegistered') {
                            $staleToken = $messages[$index]['to'] ?? null;
                            if ($staleToken) {
                                ClientDeviceToken::where('push_token', $staleToken)->delete();
                                Log::info("[PushNotificationService] Pruned unregistered device token: {$staleToken}");
                            }
                        }
                    }
                }

                return true;
            }

            Log::warning('[PushNotificationService] Expo Push API responded with status ' . $response->status(), [
                'body' => $response->body(),
            ]);
            return false;
        } catch (\Throwable $e) {
            Log::warning('[PushNotificationService] HTTP error connecting to Expo Push API: ' . $e->getMessage());
            return false;
        }
    }
}
