<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_returns_only_published_products_with_a_consistent_resource(): void
    {
        $category = $this->category();
        $published = $this->product($category, ['name' => 'Trâm hoa cúc', 'slug' => 'tram-hoa-cuc']);
        $this->product($category, ['name' => 'Bản nháp', 'slug' => 'ban-nhap', 'status' => 'draft']);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $published->id)
            ->assertJsonStructure(['data' => [['id', 'name', 'slug', 'category_id', 'category', 'price', 'images']]]);
    }

    public function test_detail_returns_a_published_product_and_hides_drafts(): void
    {
        $category = $this->category();
        $product = $this->product($category, ['slug' => 'tram-sen']);
        $draft = $this->product($category, ['slug' => 'tram-nhap', 'status' => 'draft']);

        $this->getJson("/api/products/{$product->slug}")
            ->assertOk()
            ->assertJsonPath('data.category.slug', $category->slug);
        $this->getJson("/api/products/{$draft->slug}")->assertNotFound();
    }

    public function test_search_matches_name_description_and_sku(): void
    {
        $category = $this->category();
        $this->product($category, ['name' => 'Trâm hoa sen', 'slug' => 'tram-hoa-sen']);
        $this->product($category, ['name' => 'Vòng ngọc', 'slug' => 'vong-ngoc']);

        $this->getJson('/api/products?search=hoa%20sen')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'tram-hoa-sen');
    }

    public function test_filters_by_category_and_price_and_sorts_results(): void
    {
        $hairpins = $this->category(['name' => 'Trâm cài', 'slug' => 'tram-cai']);
        $bracelets = $this->category(['name' => 'Vòng tay', 'slug' => 'vong-tay']);
        $this->product($hairpins, ['slug' => 'tram-re', 'price' => 100000]);
        $expensive = $this->product($hairpins, ['slug' => 'tram-dat', 'price' => 500000]);
        $this->product($bracelets, ['slug' => 'vong-tay-a', 'price' => 300000]);

        $this->getJson("/api/products?category={$hairpins->id}&min_price=200000&max_price=600000&sort=price_desc")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $expensive->id);
    }

    public function test_pagination_returns_metadata_and_validates_parameters(): void
    {
        $category = $this->category();
        foreach (range(1, 3) as $index) {
            $this->product($category, ['slug' => "san-pham-{$index}"]);
        }

        $this->getJson('/api/products?page=2&per_page=2')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)->assertJsonPath('meta.total', 3);
        $this->getJson('/api/products?per_page=100')->assertUnprocessable();
        $this->getJson('/api/products?min_price=500&max_price=100')->assertUnprocessable();
    }

    public function test_related_new_arrivals_best_sellers_and_categories_are_available(): void
    {
        $category = $this->category();
        $product = $this->product($category, ['slug' => 'san-pham-chinh']);
        $related = $this->product($category, ['slug' => 'lien-quan', 'is_new' => true, 'featured' => true, 'rating' => 5]);

        $this->getJson("/api/products/{$product->slug}/related")
            ->assertOk()->assertJsonPath('data.0.id', $related->id);
        $this->getJson('/api/products/new-arrivals')->assertOk()->assertJsonPath('data.0.id', $related->id);
        $this->getJson('/api/products/best-sellers')->assertOk()->assertJsonPath('data.0.id', $related->id);
        $this->getJson('/api/categories')->assertOk()->assertJsonPath('data.0.slug', $category->slug);
        $this->getJson("/api/categories/{$category->slug}")->assertOk()->assertJsonPath('data.id', $category->id);
    }

    private function category(array $attributes = []): Category
    {
        return Category::create(array_merge([
            'name' => 'Phụ kiện tóc',
            'slug' => 'phu-kien-toc',
            'description' => 'Trang sức tóc cổ phục Việt Nam.',
        ], $attributes));
    }

    private function product(Category $category, array $attributes = []): Product
    {
        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Sản phẩm Daisy',
            'slug' => 'san-pham-'.uniqid(),
            'description' => 'Trang sức thủ công lấy cảm hứng từ cổ phục Việt Nam.',
            'short_description' => 'Chế tác thủ công.',
            'price' => 250000,
            'material' => 'Đồng mạ vàng',
            'color' => 'Vàng',
            'stock' => 10,
            'images' => ['products/sample.webp'],
            'featured' => false,
            'is_new' => false,
            'rating' => 4.5,
            'sku' => 'DS-'.uniqid(),
            'status' => 'published',
        ], $attributes));
    }
}
