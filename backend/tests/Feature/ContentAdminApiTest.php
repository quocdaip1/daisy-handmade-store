<?php

namespace Tests\Feature;

use App\Models\Banner;
use App\Models\Policy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContentAdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_admin_endpoints_require_admin_access(): void
    {
        $this->getJson('/api/admin/banners')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        foreach (['banners', 'contacts', 'policies'] as $endpoint) {
            $this->getJson("/api/admin/{$endpoint}")->assertForbidden();
        }
    }

    public function test_admin_can_manage_existing_banner_slots_without_new_schema(): void
    {
        config()->set('admin_features.banners', true);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $bannerId = $this->postJson('/api/admin/banners', [
            'title' => 'Daisy thủ công', 'image' => '/banners/home.webp',
            'link' => '/san-pham', 'position' => 0, 'active' => true,
        ])->assertCreated()->assertJsonPath('data.position', 0)->json('data.id');

        $this->getJson('/api/admin/banners')->assertOk()->assertJsonPath('data.0.id', $bannerId);
        $this->getJson('/api/banners')->assertOk()->assertJsonPath('data.0.id', $bannerId);

        $this->putJson("/api/admin/banners/{$bannerId}", [
            'title' => 'Bộ sưu tập Liên Hoa', 'image' => '/banners/collection.webp',
            'link' => '/san-pham', 'position' => 1, 'active' => false,
        ])->assertOk()->assertJsonPath('data.active', false)->assertJsonPath('data.position', 1);
        $this->getJson('/api/banners')->assertOk()->assertJsonCount(0, 'data');
        $this->postJson('/api/admin/banners', ['title' => '', 'position' => 3])
            ->assertUnprocessable()->assertJsonValidationErrors(['title', 'image', 'position']);
    }

    public function test_admin_can_read_contact_submissions_without_crm_workflow(): void
    {
        config()->set('admin_features.contacts', true);
        $contactId = $this->postJson('/api/contacts', [
            'name' => 'Khách Daisy', 'email' => 'guest@example.com', 'phone' => '0901234567',
            'subject' => 'Tư vấn sản phẩm', 'message' => 'Tôi cần thông tin về bộ sưu tập.',
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/contacts')->assertOk()->assertJsonPath('data.0.id', $contactId);
        $this->getJson("/api/admin/contacts/{$contactId}")->assertOk()
            ->assertJsonPath('data.email', 'guest@example.com')
            ->assertJsonPath('data.status', 'new');
    }

    public function test_admin_can_manage_policy_content_and_public_api_only_shows_published(): void
    {
        config()->set('admin_features.policies', true);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $policyId = $this->postJson('/api/admin/policies', [
            'title' => 'Chính sách đổi trả', 'slug' => 'doi-tra',
            'content' => 'Nội dung chính sách.', 'version' => 1, 'published' => false,
        ])->assertCreated()->assertJsonPath('data.published', false)->json('data.id');
        $this->getJson('/api/admin/policies')->assertOk()->assertJsonPath('data.0.id', $policyId);
        $this->getJson('/api/policies/doi-tra')->assertNotFound();

        $this->putJson("/api/admin/policies/{$policyId}", [
            'title' => 'Chính sách đổi trả', 'slug' => 'doi-tra',
            'content' => 'Nội dung đã cập nhật.', 'version' => 2, 'published' => true,
        ])->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.published', true);
        $this->getJson('/api/policies/doi-tra')->assertOk()->assertJsonPath('data.content', 'Nội dung đã cập nhật.');
        $this->postJson('/api/admin/policies', ['title' => '', 'slug' => 'doi-tra'])
            ->assertUnprocessable()->assertJsonValidationErrors(['title', 'slug', 'content', 'version']);
    }

    public function test_disabled_admin_content_endpoints_do_not_affect_public_content(): void
    {
        $banner = Banner::create([
            'title' => 'Banner hiện có', 'image' => '/banners/home.webp',
            'position' => 0, 'active' => true,
        ]);
        $policy = Policy::create([
            'title' => 'Chính sách hiện có', 'slug' => 'chinh-sach-hien-co',
            'content' => 'Nội dung đang hiển thị.', 'version' => 1, 'published' => true,
        ]);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        foreach (['banners', 'contacts', 'policies'] as $endpoint) {
            $this->getJson("/api/admin/{$endpoint}")->assertNotFound();
        }
        $this->postJson('/api/admin/banners', [])->assertNotFound();
        $this->putJson("/api/admin/banners/{$banner->id}", [])->assertNotFound();
        $this->getJson('/api/admin/contacts/1')->assertNotFound();
        $this->postJson('/api/admin/policies', [])->assertNotFound();
        $this->putJson("/api/admin/policies/{$policy->id}", [])->assertNotFound();

        $this->getJson('/api/banners')->assertOk()->assertJsonPath('data.0.id', $banner->id);
        $this->getJson('/api/policies')->assertOk()->assertJsonPath('data.0.id', $policy->id);
        $this->getJson('/api/policies/chinh-sach-hien-co')->assertOk();
        $this->postJson('/api/contacts', [
            'name' => 'Khách Daisy', 'email' => 'guest@example.com',
            'subject' => 'Tư vấn sản phẩm', 'message' => 'Tôi cần tư vấn.',
        ])->assertCreated();
        $this->assertDatabaseHas('banners', ['id' => $banner->id, 'active' => true]);
        $this->assertDatabaseHas('policies', ['id' => $policy->id, 'published' => true]);
        $this->assertDatabaseCount('contacts', 1);
    }
}
