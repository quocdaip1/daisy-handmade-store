<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductGalleryService
{
    public const MAX_IMAGES = 8;

    public function metadata(array $data, ?Product $product = null): array
    {
        $images = array_values(array_unique($data['images'] ?? $product?->images ?? []));
        $cover = array_key_exists('cover_image', $data) ? $data['cover_image'] : $product?->cover_image;
        if ($cover !== null && ! in_array($cover, $images, true)) {
            if (array_key_exists('cover_image', $data) && $cover !== $product?->cover_image) {
                throw ValidationException::withMessages(['cover_image' => 'Ảnh đại diện phải nằm trong gallery.']);
            }
            $cover = null;
        }

        return array_merge($data, ['images' => $images, 'cover_image' => $cover]);
    }

    public function upload(Product $product, array $files): array
    {
        return DB::transaction(function () use ($product, $files): array {
            $locked = Product::query()->lockForUpdate()->findOrFail($product->id);
            if (count($locked->images ?? []) + count($files) > self::MAX_IMAGES) {
                throw ValidationException::withMessages(['images' => 'Mỗi sản phẩm có tối đa '.self::MAX_IMAGES.' ảnh.']);
            }
            $paths = array_map(fn ($file) => app(ProductImageStorage::class)->store($file), $files);
            $images = array_values(array_unique(array_merge($locked->images ?? [], $paths)));
            $locked->update(['images' => $images]);

            return $images;
        });
    }
}
