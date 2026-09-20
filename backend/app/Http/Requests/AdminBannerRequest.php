<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'image' => ['required', 'string', 'max:2048'],
            'link' => ['nullable', 'string', 'max:2048'],
            'position' => ['required', 'integer', Rule::in([0, 1])],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
