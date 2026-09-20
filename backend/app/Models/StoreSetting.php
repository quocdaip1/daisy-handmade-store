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
            ],
            'seo_defaults' => [
                'title' => config('app.name'),
                'description' => '',
                'keywords' => '',
                'og_image_url' => '',
            ],
        ]);
    }
}
