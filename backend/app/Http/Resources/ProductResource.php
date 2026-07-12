<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', fn () => $this->category?->only(['id', 'name', 'slug'])),
            'description' => $this->description,
            'short_description' => $this->short_description,
            'price' => $this->price,
            'original_price' => $this->original_price,
            'material' => $this->material,
            'color' => $this->color,
            'stock' => $this->stock,
            'images' => $this->images ?? [],
            'featured' => $this->featured,
            'is_new' => $this->is_new,
            'rating' => $this->rating,
        ];
    }
}
