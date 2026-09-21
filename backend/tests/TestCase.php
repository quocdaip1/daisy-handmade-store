<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** @param array<int, array{product_id: int, quantity: int}> $items */
    protected function checkoutPreviewPayload(array $items = [], array $overrides = []): array
    {
        return array_merge([
            'items' => $items,
            'address' => [
                'name' => 'Daisy Customer',
                'phone' => '0901234567',
                'city' => 'Việt Nam',
                'district' => 'Đồng Nai',
                'address' => 'Địa chỉ nhận hàng',
            ],
            'customer_email' => 'customer@example.com',
            'payment_method' => 'bank_transfer',
        ], $overrides);
    }

    /** @param array<int, array{product_id: int, quantity: int}> $items */
    protected function orderPayloadFromPreview(array $items, array $overrides = []): array
    {
        $previewPayload = $this->checkoutPreviewPayload($items, array_intersect_key($overrides, array_flip(['coupon_code', 'note'])));
        $previewId = $this->postJson('/api/checkout/preview', $previewPayload)->assertOk()->json('data.preview_id');

        return array_merge([
            'preview_id' => $previewId,
            'items' => $items,
            'customer_name' => 'Daisy Customer',
            'customer_email' => 'customer@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => 'Địa chỉ nhận hàng, Đồng Nai, Việt Nam',
            'payment_method' => 'bank_transfer',
        ], $overrides);
    }
}
