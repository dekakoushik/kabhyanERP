<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'blocked'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'estimated_hours' => ['nullable', 'integer', 'min:0'],
            'logged_hours' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}
