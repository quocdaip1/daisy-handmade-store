<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = ['shop_information', 'bank_account', 'social_links', 'seo_defaults'];

    protected $casts = [
        'shop_information' => 'array',
        'bank_account' => 'array',
        'social_links' => 'array',
        'seo_defaults' => 'array',
    ];

    public static function current(): self
    {
        return self::query()->firstOrCreate([], [
            'shop_information' => [
                'name' => config('app.name'),
                'email' => '',
                'phone' => '',
                'address' => '',
                'opening_hours' => '',
            ],
            'bank_account' => config('payments.bank_transfer'),
            'social_links' => [
                'facebook' => '',
                'instagram' => '',
                'tiktok' => '',
                'youtube' => '',
                'messenger' => '',
                'contact_popup' => self::defaultContactPopup(),
            ],
            'seo_defaults' => [
                'title' => config('app.name'),
                'description' => '',
                'keywords' => '',
                'og_image_url' => '',
            ],
        ]);
    }

    public static function defaultContactPopup(): array
    {
        return [
            'facebook' => [
                'display_name' => '',
                'link' => '',
                'enabled' => false,
            ],
            'zalo' => [
                'display_name' => '',
                'phone' => '',
                'link' => '',
                'enabled' => false,
            ],
        ];
    }

    public function contactPopup(): array
    {
        $socialLinks = is_array($this->social_links) ? $this->social_links : [];
        $stored = is_array($socialLinks['contact_popup'] ?? null) ? $socialLinks['contact_popup'] : [];
        $defaults = self::defaultContactPopup();

        return [
            'facebook' => array_merge($defaults['facebook'], is_array($stored['facebook'] ?? null) ? $stored['facebook'] : []),
            'zalo' => array_merge($defaults['zalo'], is_array($stored['zalo'] ?? null) ? $stored['zalo'] : []),
        ];
    }

    public function updateContactPopup(array $contactPopup): void
    {
        $socialLinks = is_array($this->social_links) ? $this->social_links : [];
        $socialLinks['contact_popup'] = $contactPopup;
        $this->update(['social_links' => $socialLinks]);
    }
}
