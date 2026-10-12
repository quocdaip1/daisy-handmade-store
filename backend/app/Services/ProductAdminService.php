<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductAdminService
{
    public function __construct(private readonly ProductGalleryService $gallery) {}

    public function save(array $data, ?Product $product = null): Product
    {
        return DB::transaction(function () use ($data, $product): Product {
            $product = $product ? Product::query()->lockForUpdate()->findOrFail($product->id) : new Product;
            $oldMode = $product->inventory_mode ?? 'shared';
            $mode = $data['inventory_mode'] ?? $oldMode;
            $rows = $data['variants'] ?? $product->variants()->get()->toArray();
            $confirmed = $data['confirm_stock_adjustment'] ?? false;
            unset($data['variants'], $data['confirm_stock_adjustment']);
            $data = $this->gallery->metadata($data, $product->exists ? $product : null);
            $active = collect($rows)->filter(fn ($row) => $row['active'] ?? true);
            if ($mode === 'variant' && ($active->isEmpty() || $active->contains(fn ($row) => ! isset($row['stock'])))) {
                $this->fail('variants', 'Phải nhập tồn cho tất cả màu đang bán; tồn 0 là hợp lệ.');
            }
            if ($mode !== $oldMode && $product->exists && OrderItem::query()->where('product_id', $product->id)
                ->whereHas('order', fn ($query) => $query->whereIn('status', ['pending', 'confirmed']))->exists()) {
                $this->fail('inventory_mode', 'Chưa thể chuyển chế độ khi còn đơn chờ xử lý hoặc đã xác nhận.');
            }
            $oldStock = $product->exists ? $product->availableStock() : ($data['stock'] ?? 0);
            $newStock = $mode === 'variant' ? $active->sum('stock') : ($data['stock'] ?? $product->stock);
            if ($mode !== $oldMode && $newStock !== $oldStock && ! $confirmed) {
                $this->fail('confirm_stock_adjustment', 'Tổng tồn mới khác tồn hiện tại. Vui lòng xác nhận điều chỉnh.');
            }
            // In variant mode the only inventory source is each variant, not products.stock.
            $data['stock'] = $mode === 'variant' ? 0 : $newStock;
            $data['inventory_mode'] = $mode;
            $product->fill($data)->save();
            $kept = [];
            foreach ($rows as $row) {
                $variant = isset($row['id']) ? $product->variants()->whereKey($row['id'])->first() : $product->variants()->make();
                if (! $variant) {
                    $this->fail('variants', 'Màu không thuộc sản phẩm này.');
                }
                if ($product->variants()->whereRaw('LOWER(color_name) = ?', [mb_strtolower(trim($row['color_name']))])
                    ->when($variant->exists, fn ($query) => $query->where('id', '!=', $variant->id))->exists()) {
                    $this->fail('variants', 'Tên màu đã tồn tại. Hãy chỉnh sửa hoặc mở bán lại màu đã lưu.');
                }
                $images = array_values(array_unique($row['images'] ?? []));
                if (array_diff($images, $data['images'])) {
                    $this->fail('variants', 'Ảnh màu phải nằm trong gallery sản phẩm.');
                }
                $variant->fill(['color_name' => trim($row['color_name']), 'stock' => $row['stock'] ?? null, 'images' => $images, 'active' => $row['active'] ?? true]);
                $variant->save();
                $kept[] = $variant->id;
            }
            // Archive rather than delete so carts and order history retain their references.
            $product->variants()->whereNotIn('id', $kept)->update(['active' => false]);

            return $product->fresh(['category', 'variants']);
        });
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
