<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'category_id',
        'description',
        'short_description',
        'price',
        'original_price',
        'material',
        'color',
        'stock',
        'images',
        'featured',
        'is_new',
        'rating',
        'sku',
        'status',
        'inventory_mode',
        'cover_image',
    ];

    protected $casts = [
        'images' => 'array',
        'featured' => 'boolean',
        'is_new' => 'boolean',
        'price' => 'integer',
        'original_price' => 'integer',
        'stock' => 'integer',
        'rating' => 'float',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('id');
    }

    public function availableStock(): int
    {
        return $this->inventory_mode === 'variant'
            ? (int) $this->variants->where('active', true)->sum('stock')
            : $this->stock;
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeLowStock(Builder $query, int $maximum): Builder
    {
        return $query->where(fn (Builder $query) => $query
            ->where(fn (Builder $query) => $query->where('inventory_mode', 'shared')->where('stock', '<=', $maximum))
            ->orWhere(fn (Builder $query) => $query->where('inventory_mode', 'variant')->whereRaw(
                '(SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_variants.product_id = products.id AND active = ?) <= ?',
                [true, $maximum],
            )));
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        return $query->when($term, fn (Builder $query, string $term) => $query->where(
            fn (Builder $query) => $query->where('name', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%")
                ->orWhere('short_description', 'like', "%{$term}%")
                ->orWhere('sku', 'like', "%{$term}%")
        ));
    }

    public function scopeInCategory(Builder $query, ?int $categoryId): Builder
    {
        return $query->when($categoryId, fn (Builder $query, int $categoryId) => $query->where('category_id', $categoryId));
    }

    public function scopeInPriceRange(Builder $query, ?int $minimum, ?int $maximum): Builder
    {
        return $query
            ->when($minimum !== null, fn (Builder $query) => $query->where('price', '>=', $minimum))
            ->when($maximum !== null, fn (Builder $query) => $query->where('price', '<=', $maximum));
    }

    public function scopeSorted(Builder $query, string $sort = 'featured'): Builder
    {
        return match ($sort) {
            'price_asc' => $query->orderBy('price')->orderByDesc('id'),
            'price_desc' => $query->orderByDesc('price')->orderByDesc('id'),
            'newest' => $query->latest(),
            'rating_desc' => $query->orderByDesc('rating')->orderByDesc('id'),
            'name_asc' => $query->orderBy('name')->orderBy('id'),
            default => $query->orderByDesc('featured')->latest(),
        };
    }
}
