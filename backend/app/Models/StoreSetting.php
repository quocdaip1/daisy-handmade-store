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
            'shop_information' => self::defaultShopInformation(),
            'bank_account' => config('payments.bank_transfer'),
            'social_links' => self::defaultSocialLinks(),
            'seo_defaults' => self::defaultSeoDefaults(),
        ]);
    }

    public static function defaultShopInformation(): array
    {
        return [
            'name' => config('app.name'),
            'email' => '',
            'phone' => '',
            'address' => '',
            'opening_hours' => '',
        ];
    }

    public static function defaultSocialLinks(): array
    {
        return [
            'facebook' => '',
            'instagram' => '',
            'tiktok' => '',
            'youtube' => '',
            'messenger' => '',
            'contact_popup' => self::defaultContactPopup(),
        ];
    }

    public static function defaultSeoDefaults(): array
    {
        return [
            'title' => config('app.name'),
            'description' => '',
            'keywords' => '',
            'og_image_url' => '',
        ];
    }

    public function shopInformation(): array
    {
        return array_replace(self::defaultShopInformation(), is_array($this->shop_information) ? $this->shop_information : []);
    }

    public function bankAccount(): array
    {
        return array_replace((array) config('payments.bank_transfer'), is_array($this->bank_account) ? $this->bank_account : []);
    }

    public function socialLinks(): array
    {
        $socialLinks = array_replace(self::defaultSocialLinks(), is_array($this->social_links) ? $this->social_links : []);
        $socialLinks['contact_popup'] = $this->contactPopup();

        return $socialLinks;
    }

    public function seoDefaults(): array
    {
        return array_replace(self::defaultSeoDefaults(), is_array($this->seo_defaults) ? $this->seo_defaults : []);
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

    public function publicContactPopup(): array
    {
        $contactPopup = $this->contactPopup();
        $zaloPhone = preg_replace('/\D+/', '', (string) $contactPopup['zalo']['phone']);
        $zaloLink = trim((string) $contactPopup['zalo']['link']);

        if ($zaloLink === '' && $zaloPhone !== '') {
            $zaloLink = 'https://zalo.me/'.$zaloPhone;
        }

        return [
            'facebook' => [
                'display_name' => $contactPopup['facebook']['display_name'],
                'link' => $contactPopup['facebook']['link'],
                'enabled' => (bool) $contactPopup['facebook']['enabled'],
            ],
            'zalo' => [
                'display_name' => $contactPopup['zalo']['display_name'],
                'phone' => $contactPopup['zalo']['phone'],
                'link' => $zaloLink,
                'enabled' => (bool) $contactPopup['zalo']['enabled'],
            ],
        ];
    }
}
