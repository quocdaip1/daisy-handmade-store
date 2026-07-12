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
                'quantity' => $item->quantity,
                'unit_price' => $item->product->price,
                'line_total' => $item->product->price * $item->quantity,
                'available_stock' => $item->product->stock,
            ])->values(),
            'item_count' => $items->sum('quantity'),
            'subtotal' => $items->sum(fn ($item) => $item->product->price * $item->quantity),
        ];
    }
}
