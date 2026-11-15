<?php

use App\Models\Invoice;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Console Tasks & Automated Maintenance (Laravel 13 Standard)
|--------------------------------------------------------------------------
*/

// Prune expired Sanctum tokens from PostgreSQL daily
Schedule::command('sanctum:prune-expired --hours=720')->daily();

// Prune failed queue jobs older than 7 days weekly
Schedule::command('queue:prune-failed --hours=168')->weekly();

// Flag overdue invoices daily at midnight
Schedule::call(function () {
    Invoice::where('status', 'unpaid')
        ->whereDate('due_date', '<', now())
        ->update(['status' => 'overdue']);
})->dailyAt('00:05');
