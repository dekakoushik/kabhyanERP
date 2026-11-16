<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyAttendance extends Model
{
    use HasFactory;

    protected $table = 'daily_attendances';

    protected $fillable = [
        'user_id',
        'attendance_date',
        'punch_in',
        'punch_out',
        'punch_in_latitude',
        'punch_in_longitude',
        'punch_in_address',
        'punch_out_latitude',
        'punch_out_longitude',
        'punch_out_address',
        'device_id',
        'device_model',
        'ip_address',
        'status',
        'source',
        'work_minutes',
        'is_late',
        'is_half_day',
        'is_overridden',
        'overridden_by',
        'override_reason',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'punch_in' => 'datetime',
        'punch_out' => 'datetime',
        'punch_in_latitude' => 'decimal:7',
        'punch_in_longitude' => 'decimal:7',
        'punch_out_latitude' => 'decimal:7',
        'punch_out_longitude' => 'decimal:7',
        'is_late' => 'boolean',
        'is_half_day' => 'boolean',
        'is_overridden' => 'boolean',
        'work_minutes' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function overrider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'overridden_by');
    }
}
