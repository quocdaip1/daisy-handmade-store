<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Validation\ValidationException;

class ProductInventoryService
{
    public function selection(Product $product, ?int $variantId, bool $lock = false): array
    {
        $variant = null;
        if ($variantId !== null) {
            $query = $product->variants()->whereKey($variantId)->where('active', true);
            $variant = ($lock ? $query->lockForUpdate() : $query)->first();
            if (! $variant) {
                $this->fail('Màu không thuộc sản phẩm hoặc đã ngừng bán.');
            }
        }
        if ($product->inventory_mode === 'variant' && (! $variant || $variant->stock === null)) {
            $this->fail('Vui lòng chọn màu có tồn kho đã được xác nhận.');
        }

        return [
            'variant' => $variant,
            'source' => $product->inventory_mode === 'variant' ? 'variant' : 'shared',
            'stock' => $product->inventory_mode === 'variant' ? $variant->stock : $product->stock,
        ];
    }

    public function ensureAvailable(Product $product, array $selection, int $quantity, string $field = 'cart'): void
    {
        if ($product->status !== 'published' || $quantity < 1 || $quantity > $selection['stock']) {
            throw ValidationException::withMessages([$field => 'Sản phẩm hoặc màu đã chọn không đủ tồn kho.']);
        }
    }

    public function consume(Product $product, ?int $variantId, int $quantity): array
    {
        $selection = $this->selection($product, $variantId, true);
        $this->ensureAvailable($product, $selection, $quantity);
        $model = $selection['source'] === 'variant' ? $selection['variant'] : $product;
        // Conditional decrement is a second protection even when a driver has no row locks.
        $updated = $model->newQuery()->whereKey($model->id)->where('stock', '>=', $quantity)->decrement('stock', $quantity);
        if ($updated !== 1) {
            $this->fail('Tồn kho vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.');
        }

        return $selection;
    }

    public function restore(OrderItem $item, ?Product $product): void
    {
        if ($item->inventory_source === 'variant') {
            $variant = ProductVariant::query()->lockForUpdate()->findOrFail($item->variant_id);
            $variant->increment('stock', $item->quantity);
        } elseif ($product) {
            $product->increment('stock', $item->quantity);
        }
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['cart' => $message]);
    }
}
