<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SettingController extends Controller
{
    /**
     * Get all system settings grouped by categories, plus live server health.
     */
    public function index(Request $request)
    {
        $grouped = Cache::remember('all_system_settings_grouped', 3600, function () {
            return SystemSetting::all()->groupBy('group');
        });

        // Check Redis status
        $redisStatus = 'connected';
        $redisPing = 'PONG';
        try {
            $redisPing = Redis::ping();
        } catch (\Throwable $e) {
            $redisStatus = 'disconnected: ' . $e->getMessage();
        }

        // Database status
        $dbStatus = 'connected';

        // System Health / Environment
        $environment = [
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_status' => $dbStatus,
            'redis_status' => $redisStatus,
            'redis_ping' => $redisPing,
            'cache_driver' => config('cache.default'),
            'server_time' => now()->toDateTimeString(),
            'timezone' => config('app.timezone'),
        ];

        return response()->json([
            'settings' => $grouped,
            'environment' => $environment,
        ]);
    }

    /**
     * Bulk update settings by group or key-value pairs.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.group' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $item) {
            SystemSetting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => is_array($item['value']) ? json_encode($item['value']) : $item['value'],
                    'group' => $item['group'] ?? 'general',
                ]
            );
            Cache::forget("setting_{$item['key']}");
        }

        Cache::forget('all_system_settings');
        Cache::forget('all_system_settings_grouped');

        return response()->json([
            'message' => 'System settings updated successfully.',
        ]);
    }

    /**
     * Flush application and Redis cache.
     */
    public function flushCache(Request $request)
    {
        try {
            Cache::flush();
            Redis::flushall();
            return response()->json(['message' => 'Application & Redis cache cleared successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Cache cleared (partial): ' . $e->getMessage()]);
        }
    }
}

