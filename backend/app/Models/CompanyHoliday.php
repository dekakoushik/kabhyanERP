<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class CompanyHoliday extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'holiday_date',
        'is_optional',
        'description',
    ];

    protected $casts = [
        'holiday_date' => 'date:Y-m-d',
        'is_optional' => 'boolean',
    ];

    protected $appends = [
        'name',
        'date',
        'day_of_week',
        'type',
    ];

    public function getNameAttribute(): string
    {
        return $this->title ?? '';
    }

    public function getDateAttribute(): ?string
    {
        return $this->holiday_date ? Carbon::parse($this->holiday_date)->format('Y-m-d') : null;
    }

    public function getDayOfWeekAttribute(): string
    {
        return $this->holiday_date ? Carbon::parse($this->holiday_date)->format('l') : '';
    }

    public function getTypeAttribute(): string
    {
        if ($this->description && stripos($this->description, 'festival') !== false) {
            return 'festival';
        }
        if ($this->description && stripos($this->description, 'national') !== false) {
            return 'national';
        }
        return $this->is_optional ? 'optional' : 'company';
    }
}
