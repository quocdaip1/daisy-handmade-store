<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

class ProductImageUrl
{
    public static function publicUrl(string $url): string
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $path = (string) parse_url($url, PHP_URL_PATH);

        // Recover only legacy local upload URLs, preserving external images/assets.
        if (in_array($host, ['localhost', '127.0.0.1', '[::1]'], true)
            && str_starts_with($path, '/storage/products/')) {
            return Storage::disk('public')->url(substr($path, strlen('/storage/')));
        }

        return $url;
    }
}
