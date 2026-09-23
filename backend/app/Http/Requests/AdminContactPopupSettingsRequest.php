<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AdminContactPopupSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'facebook' => ['required', 'array'],
            'facebook.display_name' => ['nullable', 'string', 'max:100'],
            'facebook.link' => ['nullable', 'url:http,https', 'max:2048'],
            'facebook.enabled' => ['required', 'boolean'],
            'zalo' => ['required', 'array'],
            'zalo.display_name' => ['nullable', 'string', 'max:100'],
            'zalo.phone' => ['nullable', 'regex:/^[0-9+().\s-]{8,20}$/'],
            'zalo.link' => ['nullable', 'url:http,https', 'max:2048'],
            'zalo.enabled' => ['required', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $facebook = $this->input('facebook', []);
            if (($facebook['enabled'] ?? false) && blank($facebook['display_name'] ?? null)) {
                $validator->errors()->add('facebook.display_name', 'Vui lòng nhập tên hiển thị Facebook.');
            }
            if (($facebook['enabled'] ?? false) && blank($facebook['link'] ?? null)) {
                $validator->errors()->add('facebook.link', 'Vui lòng nhập link Facebook hoặc Messenger.');
            }

            $zalo = $this->input('zalo', []);
            if (($zalo['enabled'] ?? false) && blank($zalo['display_name'] ?? null)) {
                $validator->errors()->add('zalo.display_name', 'Vui lòng nhập tên hiển thị Zalo.');
            }
            if (($zalo['enabled'] ?? false) && blank($zalo['phone'] ?? null) && blank($zalo['link'] ?? null)) {
                $validator->errors()->add('zalo.phone', 'Vui lòng nhập số điện thoại hoặc link Zalo.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'facebook.link.url' => 'Link Facebook hoặc Messenger không hợp lệ.',
            'zalo.phone.regex' => 'Số điện thoại Zalo không hợp lệ.',
            'zalo.link.url' => 'Link Zalo không hợp lệ.',
        ];
    }
}
