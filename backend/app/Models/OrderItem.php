<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['product_id', 'product_name', 'product_sku', 'quantity', 'price', 'total'];

    protected $casts = ['quantity' => 'integer', 'price' => 'integer', 'total' => 'integer'];
}
