<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\ShippingMethod;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_require_admin_authorization(): void
    {
        $this->getJson('/api/admin/settings')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->getJson('/api/admin/settings')->assertForbidden();
        $this->putJson('/api/admin/settings', $this->payload())->assertForbidden();
    }

    public function test_admin_can_read_and_update_all_setting_groups(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        ShippingMethod::create([
            'name' => 'Giao cũ', 'code' => 'legacy', 'fee' => 50000, 'active' => true,
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/settings')->assertOk()->assertJsonStructure(['data' => [
            'shop_information', 'bank_account', 'shipping_methods', 'social_links', 'seo_defaults',
        ]]);

        $this->putJson('/api/admin/settings', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.shop_information.name', 'Daisy Handmade')
            ->assertJsonPath('data.bank_account.bank_name', 'ACB')
            ->assertJsonPath('data.shipping_methods.1.code', 'standard')
            ->assertJsonPath('data.social_links.facebook', 'https://facebook.com/daisy')
            ->assertJsonPath('data.seo_defaults.title', 'Daisy Handmade Store');

        $this->assertDatabaseHas('shipping_methods', ['code' => 'standard', 'fee' => 30000, 'active' => true]);
        $this->assertDatabaseHas('shipping_methods', ['code' => 'legacy', 'active' => false]);
        $this->assertSame('ACB', StoreSetting::current()->bank_account['bank_name']);
    }

    public function test_bank_and_shipping_settings_are_used_by_existing_flows(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson('/api/admin/settings', $this->payload())->assertOk();

        $this->postJson('/api/shipping/quote', ['subtotal' => 100000])
            ->assertOk()
            ->assertJsonPath('data.0.code', 'standard')
            ->assertJsonPath('data.0.fee', 30000);

        $order = Order::create([
            'number' => 'DS-SETTING-1', 'user_id' => $customer->id, 'status' => 'pending',
            'payment_method' => 'bank_transfer', 'payment_status' => 'pending_verification',
            'customer_name' => $customer->name, 'customer_email' => $customer->email,
            'customer_phone' => '0901234567', 'shipping_address' => 'Hà Nội',
            'subtotal' => 500000, 'discount' => 0, 'shipping_fee' => 30000, 'total' => 530000,
        ]);
        $payment = app(PaymentService::class)->createForOrder($order);

        $this->assertSame('ACB', $payment->metadata['bank_name']);
        $this->assertSame('123456789', $payment->metadata['account_number']);
        $this->assertSame('DAISY DS-SETTING-1', $payment->metadata['transfer_content']);
    }

    public function test_settings_validation_rejects_invalid_configuration(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $payload = $this->payload();
        $payload['bank_account']['bank_name'] = '';
        $payload['shipping_methods'][0]['fee'] = -1;
        $payload['social_links']['facebook'] = 'not-a-url';
        $payload['seo_defaults']['description'] = str_repeat('a', 161);

        $this->putJson('/api/admin/settings', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'bank_account.bank_name',
                'shipping_methods.0.fee',
                'social_links.facebook',
                'seo_defaults.description',
            ]);
    }

    private function payload(): array
    {
        return [
            'shop_information' => [
                'name' => 'Daisy Handmade', 'email' => 'hello@daisy.test',
                'phone' => '0901234567', 'address' => 'Hà Nội', 'opening_hours' => '08:00 - 18:00',
            ],
            'bank_account' => [
                'bank_name' => 'ACB', 'account_number' => '123456789',
                'account_owner' => 'DAISY HANDMADE', 'transfer_prefix' => 'DAISY',
                'qr_image_url' => 'https://example.com/qr.png',
            ],
            'shipping_methods' => [[
                'name' => 'Tiêu chuẩn', 'code' => 'standard', 'fee' => 30000,
                'free_threshold' => 1000000, 'active' => true,
            ]],
            'social_links' => [
                'facebook' => 'https://facebook.com/daisy', 'instagram' => '',
                'tiktok' => '', 'youtube' => '', 'messenger' => '',
            ],
            'seo_defaults' => [
                'title' => 'Daisy Handmade Store', 'description' => 'Trang sức thủ công Việt Nam',
                'keywords' => 'trang sức, thủ công', 'og_image_url' => 'https://example.com/og.jpg',
            ],
        ];
    }
}
