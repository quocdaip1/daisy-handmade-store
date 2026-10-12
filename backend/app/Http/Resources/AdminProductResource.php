<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AdminProductResource extends ProductResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'shared_stock' => $this->stock,
            'variants' => ProductVariantResource::collection($this->variants),
            'sku' => $this->sku,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ]);
    }
}
