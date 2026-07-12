<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    protected $fillable = ['name', 'phone', 'city', 'district', 'address', 'is_default'];

    protected $casts = ['is_default' => 'boolean'];
}
