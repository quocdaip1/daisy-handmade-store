<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_cod_order_creates_unpaid_payment_and_returns_cod_summary(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $product = $this->product('cod-product');

        $this->postJson('/api/orders', $this->payload($product, 'cod'))
            ->assertOk()
            ->assertJsonPath('payment.method', 'cod')
            ->assertJsonPath('payment.status', 'unpaid')
            ->assertJsonPath('payment.amount', 350000);

        $order = $user->orders()->firstOrFail();
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'cod',
            'status' => 'unpaid',
            'amount' => 350000,
        ]);
        $this->assertNull($order->payment->metadata);
    }

    public function test_bank_transfer_order_returns_and_snapshots_transfer_instructions(): void
    {
        config()->set('payments.bank_transfer', [
            'bank_name' => 'MB Bank',
            'account_number' => '0349671134',
            'account_owner' => 'DAISY HANDMADE STORE',
            'transfer_prefix' => 'DAISY',
            'qr_image_url' => 'https://example.com/daisy-qr.png',
        ]);
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $product = $this->product('bank-product');

        $response = $this->postJson('/api/orders', $this->payload($product, 'bank_transfer'))
            ->assertOk()
            ->assertJsonPath('payment.method', 'bank_transfer')
            ->assertJsonPath('payment.status', 'pending_verification')
            ->assertJsonPath('payment.bank_name', 'MB Bank')
            ->assertJsonPath('payment.account_number', '0349671134')
            ->assertJsonPath('payment.account_owner', 'DAISY HANDMADE STORE')
            ->assertJsonPath('payment.qr_image_url', 'https://example.com/daisy-qr.png');

        $order = $user->orders()->firstOrFail();
        $response->assertJsonPath('payment.transfer_content', 'DAISY '.$order->number);
        $this->assertSame('DAISY '.$order->number, $order->payment->metadata['transfer_content']);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'bank_transfer',
            'status' => 'pending_verification',
        ]);

        $this->getJson("/api/orders/{$order->id}")
            ->assertOk()->assertJsonPath('data.payment.transfer_content', 'DAISY '.$order->number);
    }

    private function payload(Product $product, string $paymentMethod): array
    {
        return [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'customer_name' => 'Khách Daisy',
            'customer_email' => 'daisy@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => 'Hà Nội',
            'payment_method' => $paymentMethod,
        ];
    }

    private function product(string $slug): Product
    {
        $category = Category::firstOrCreate(['slug' => 'tram'], ['name' => 'Trâm', 'description' => 'Trang sức tóc']);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Trâm Daisy',
            'slug' => $slug,
            'description' => 'Trang sức cổ phục',
            'price' => 350000,
            'material' => 'Đồng',
            'color' => 'Vàng',
            'stock' => 5,
            'images' => [],
            'status' => 'published',
        ]);
    }
}
