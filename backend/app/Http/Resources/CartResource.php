<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->resource;

        return [
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'product' => new ProductResource($item->product),
                'variant_id' => $item->variant_id,
                'color_name' => $item->variant_id ? $item->product->variants->firstWhere('id', $item->variant_id)?->color_name : null,
                'quantity' => $item->quantity,
                'unit_price' => $item->product->price,
                'line_total' => $item->product->price * $item->quantity,
                'available_stock' => $item->product->inventory_mode === 'variant' ? ($item->product->variants->where('active', true)->firstWhere('id', $item->variant_id)?->stock ?? 0) : $item->product->stock,
            ])->values(),
            'item_count' => $items->sum('quantity'),
            'subtotal' => $items->sum(fn ($item) => $item->product->price * $item->quantity),
        ];
    }
}
