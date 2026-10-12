<?php

namespace App\Http\Resources;

use App\Support\ProductImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'color_name' => $this->color_name,
            'stock' => $this->stock,
            'images' => array_map(ProductImageUrl::publicUrl(...), $this->images ?? []),
            'active' => $this->active,
        ];
    }
}
