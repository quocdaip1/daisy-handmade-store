<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    protected $fillable = ['product_id', 'product_name', 'product_sku', 'quantity', 'price', 'total', 'variant_id', 'color_name', 'inventory_source'];

    protected $casts = ['quantity' => 'integer', 'price' => 'integer', 'total' => 'integer'];
}
