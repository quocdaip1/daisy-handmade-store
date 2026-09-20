<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('policies', 'slug')->ignore($this->route('policy'))],
            'content' => ['required', 'string', 'max:50000'],
            'version' => ['required', 'integer', 'min:1'],
            'published' => ['sometimes', 'boolean'],
        ];
    }
}
