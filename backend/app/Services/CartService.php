<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function __construct(private readonly ProductInventoryService $inventory) {}

    public function items(User $user): Collection
    {
        return $user->cartItems()->with(['product.category', 'product.variants'])->orderBy('id')->get();
    }

    public function add(User $user, int $productId, int $quantity, ?int $variantId = null): Collection
    {
        DB::transaction(function () use ($user, $productId, $quantity, $variantId): void {
            $product = Product::query()->lockForUpdate()->findOrFail($productId);
            $item = CartItem::query()->lockForUpdate()->firstOrNew([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'variant_id' => $variantId,
            ]);
            $newQuantity = ($item->exists ? $item->quantity : 0) + $quantity;
            $this->ensureAvailable($product, $newQuantity, $variantId, $user, $item);
            $item->quantity = $newQuantity;
            $item->save();
        });

        return $this->items($user);
    }

    public function update(User $user, CartItem $item, int $quantity): Collection
    {
        $this->ensureOwned($user, $item);
        DB::transaction(function () use ($item, $quantity, $user): void {
            $product = Product::query()->lockForUpdate()->findOrFail($item->product_id);
            $this->ensureAvailable($product, $quantity, $item->variant_id, $user, $item);
            $item->update(['quantity' => $quantity]);
        });

        return $this->items($user);
    }

    public function remove(User $user, CartItem $item): Collection
    {
        $this->ensureOwned($user, $item);
        $item->delete();

        return $this->items($user);
    }

    public function clear(User $user): void
    {
        $user->cartItems()->delete();
    }

    private function ensureAvailable(Product $product, int $quantity, ?int $variantId, User $user, CartItem $item): void
    {
        $selection = $this->inventory->selection($product, $variantId, true);
        if ($selection['source'] === 'shared') {
            $quantity += (int) $user->cartItems()->where('product_id', $product->id)->when($item->exists, fn ($q) => $q->where('id', '!=', $item->id))->sum('quantity');
        }
        $this->inventory->ensureAvailable($product, $selection, $quantity, 'quantity');
    }

    private function ensureOwned(User $user, CartItem $item): void
    {
        abort_unless($item->user_id === $user->id, 404);
    }
}
