<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    protected $fillable = ['name', 'code', 'fee', 'free_threshold', 'active'];

    protected $casts = ['fee' => 'integer', 'free_threshold' => 'integer', 'active' => 'boolean'];

    public function quote(int $subtotal): int
    {
        return $this->free_threshold && $subtotal >= $this->free_threshold ? 0 : $this->fee;
    }
}
