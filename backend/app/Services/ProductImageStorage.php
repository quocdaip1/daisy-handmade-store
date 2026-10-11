<?php

namespace App\Services;

use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductImageStorage
{
    public function store(UploadedFile $file): string
    {
        if (config('product_images.storage') === 'public') {
            return Storage::disk('public')->url($file->store('products', 'public'));
        }

        $bytes = $file->get();
        $name = hash('sha256', $bytes).'.'.$file->extension();
        ProductImage::firstOrCreate(['file_name' => $name], [
            'mime_type' => $file->getMimeType(),
            // Text encoding works consistently with both PostgreSQL and SQLite.
            'image_data' => base64_encode($bytes),
        ]);

        return rtrim(config('app.url'), '/').'/storage/products/'.$name;
    }
}
