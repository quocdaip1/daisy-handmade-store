<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
            'shop_information.phone' => ['nullable', 'regex:/^[0-9+().\s-]{8,20}$/'],
            'shop_information.address' => ['nullable', 'string', 'max:1000'],
            'shop_information.opening_hours' => ['nullable', 'string', 'max:255'],
            'bank_account' => ['required', 'array'],
            'bank_account.bank_name' => ['required', 'string', 'max:100'],
            'bank_account.account_number' => ['required', 'string', 'max:50'],
            'bank_account.account_owner' => ['required', 'string', 'max:255'],
            'bank_account.transfer_prefix' => ['required', 'alpha_dash', 'max:30'],
            'shipping_methods' => ['present', 'array', 'max:20'],
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
            'social_links.contact_popup' => ['sometimes', 'array'],
            'social_links.contact_popup.facebook' => ['required_with:social_links.contact_popup', 'array'],
            'social_links.contact_popup.facebook.display_name' => ['nullable', 'string', 'max:100'],
            'social_links.contact_popup.facebook.link' => ['nullable', 'url:http,https', 'max:2048'],
            'social_links.contact_popup.facebook.enabled' => ['required_with:social_links.contact_popup', 'boolean'],
            'social_links.contact_popup.zalo' => ['required_with:social_links.contact_popup', 'array'],
            'social_links.contact_popup.zalo.display_name' => ['nullable', 'string', 'max:100'],
            'social_links.contact_popup.zalo.phone' => ['nullable', 'regex:/^[0-9+().\s-]{8,20}$/'],
            'social_links.contact_popup.zalo.link' => ['nullable', 'url:http,https', 'max:2048'],
            'social_links.contact_popup.zalo.enabled' => ['required_with:social_links.contact_popup', 'boolean'],
            'seo_defaults' => ['required', 'array'],
            'seo_defaults.title' => ['required', 'string', 'max:60'],
            'seo_defaults.description' => ['nullable', 'string', 'max:160'],
            'seo_defaults.keywords' => ['nullable', 'string', 'max:255'],
            'seo_defaults.og_image_url' => ['nullable', 'url:http,https', 'max:2048'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $contactPopup = $this->input('social_links.contact_popup');
            if (! is_array($contactPopup)) {
                return;
            }

            $facebook = $contactPopup['facebook'] ?? [];
            if (($facebook['enabled'] ?? false) && blank($facebook['display_name'] ?? null)) {
                $validator->errors()->add('social_links.contact_popup.facebook.display_name', 'Vui lòng nhập tên hiển thị Facebook.');
            }
            if (($facebook['enabled'] ?? false) && blank($facebook['link'] ?? null)) {
                $validator->errors()->add('social_links.contact_popup.facebook.link', 'Vui lòng nhập link Facebook hoặc Messenger.');
            }

            $zalo = $contactPopup['zalo'] ?? [];
            if (($zalo['enabled'] ?? false) && blank($zalo['display_name'] ?? null)) {
                $validator->errors()->add('social_links.contact_popup.zalo.display_name', 'Vui lòng nhập tên hiển thị Zalo.');
            }
            if (($zalo['enabled'] ?? false) && blank($zalo['phone'] ?? null) && blank($zalo['link'] ?? null)) {
                $validator->errors()->add('social_links.contact_popup.zalo.phone', 'Vui lòng nhập số điện thoại hoặc link Zalo.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'shop_information.email.email' => 'Email cửa hàng không hợp lệ.',
            'shop_information.phone.regex' => 'Số điện thoại cửa hàng không hợp lệ.',
            'social_links.*.url' => 'Đường dẫn mạng xã hội không hợp lệ.',
            'social_links.contact_popup.facebook.link.url' => 'Link Facebook hoặc Messenger không hợp lệ.',
            'social_links.contact_popup.zalo.phone.regex' => 'Số điện thoại Zalo không hợp lệ.',
            'social_links.contact_popup.zalo.link.url' => 'Link Zalo không hợp lệ.',
            'seo_defaults.og_image_url.url' => 'URL ảnh chia sẻ không hợp lệ.',
        ];
    }
}
