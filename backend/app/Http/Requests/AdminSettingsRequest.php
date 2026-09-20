<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'shop_information' => ['required', 'array'],
            'shop_information.name' => ['required', 'string', 'max:255'],
            'shop_information.email' => ['nullable', 'email:rfc', 'max:255'],
            'shop_information.phone' => ['nullable', 'string', 'max:20'],
            'shop_information.address' => ['nullable', 'string', 'max:1000'],
            'shop_information.opening_hours' => ['nullable', 'string', 'max:255'],
            'bank_account' => ['required', 'array'],
            'bank_account.bank_name' => ['required', 'string', 'max:100'],
            'bank_account.account_number' => ['required', 'string', 'max:50'],
            'bank_account.account_owner' => ['required', 'string', 'max:255'],
            'bank_account.transfer_prefix' => ['required', 'alpha_dash', 'max:30'],
            'bank_account.qr_image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'shipping_methods' => ['required', 'array', 'max:20'],
            'shipping_methods.*.name' => ['required', 'string', 'max:255'],
            'shipping_methods.*.code' => ['required', 'alpha_dash', 'max:100', 'distinct'],
            'shipping_methods.*.fee' => ['required', 'integer', 'min:0'],
            'shipping_methods.*.free_threshold' => ['nullable', 'integer', 'min:0'],
            'shipping_methods.*.active' => ['required', 'boolean'],
            'social_links' => ['required', 'array'],
            'social_links.facebook' => ['nullable', 'url:http,https', 'max:2048'],
            'social_links.instagram' => ['nullable', 'url:http,https', 'max:2048'],
            'social_links.tiktok' => ['nullable', 'url:http,https', 'max:2048'],
            'social_links.youtube' => ['nullable', 'url:http,https', 'max:2048'],
            'social_links.messenger' => ['nullable', 'url:http,https', 'max:2048'],
            'seo_defaults' => ['required', 'array'],
            'seo_defaults.title' => ['required', 'string', 'max:60'],
            'seo_defaults.description' => ['nullable', 'string', 'max:160'],
            'seo_defaults.keywords' => ['nullable', 'string', 'max:255'],
            'seo_defaults.og_image_url' => ['nullable', 'url:http,https', 'max:2048'],
        ];
    }
}
