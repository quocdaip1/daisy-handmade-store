<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function items(User $user): Collection
    {
        return $user->cartItems()->with('product.category')->orderBy('id')->get();
    }

    public function add(User $user, int $productId, int $quantity): Collection
    {
        DB::transaction(function () use ($user, $productId, $quantity): void {
            $product = Product::query()->lockForUpdate()->findOrFail($productId);
            $item = CartItem::query()->lockForUpdate()->firstOrNew([
                'user_id' => $user->id,
                'product_id' => $product->id,
            ]);
            $newQuantity = ($item->exists ? $item->quantity : 0) + $quantity;
            $this->ensureAvailable($product, $newQuantity);
            $item->quantity = $newQuantity;
            $item->save();
        });

        return $this->items($user);
    }

    public function update(User $user, CartItem $item, int $quantity): Collection
    {
        $this->ensureOwned($user, $item);
        DB::transaction(function () use ($item, $quantity): void {
            $product = Product::query()->lockForUpdate()->findOrFail($item->product_id);
            $this->ensureAvailable($product, $quantity);
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

    private function ensureAvailable(Product $product, int $quantity): void
    {
        if ($product->status !== 'published' || $product->stock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => ["Sản phẩm {$product->name} không đủ tồn kho."],
            ]);
        }
    }

    private function ensureOwned(User $user, CartItem $item): void
    {
        abort_unless($item->user_id === $user->id, 404);
    }
}
