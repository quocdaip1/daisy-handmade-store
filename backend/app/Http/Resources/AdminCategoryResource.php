<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AdminCategoryResource extends CategoryResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'active' => $this->active,
            'products_count' => $this->whenCounted('products'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ]);
    }
}
