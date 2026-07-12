<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::pluck('id', 'slug');

        $products = [
            [
                'name' => 'Trâm cài tóc hoa sen',
                'slug' => 'tram-cai-toc-hoa-sen',
                'category_id' => $categories['tram-cai-toc'],
                'description' => 'Trâm cài tóc hoa sen được chế tác tinh xảo, mang cảm giác dịu dàng và sang trọng cho các dịp lễ hội.',
                'short_description' => 'Trâm cài tóc hoa sen, hoa văn chạm khắc tinh tế.',
                'price' => 890000,
                'original_price' => 1090000,
                'material' => 'Bạc vàng 18K',
                'color' => 'Vàng đồng',
                'stock' => 8,
                'images' => ['/src/assets/jewelry-1.svg'],
                'featured' => true,
                'is_new' => true,
                'rating' => 4.8,
            ],
            [
                'name' => 'Kiềng cổ chạm hoa văn',
                'slug' => 'kieng-co-cham-hoa-van',
                'category_id' => $categories['kieng-co'],
                'description' => 'Kiềng cổ chạm hoa văn làm nổi bật vẻ đẹp cổ điển hiện đại và rất phù hợp với áo dài.',
                'short_description' => 'Kiềng cổ mang nét chạm trổ tinh xảo.',
                'price' => 1490000,
                'original_price' => 1690000,
                'material' => 'Đồng đỏ',
                'color' => 'Nâu đen',
                'stock' => 6,
                'images' => ['/src/assets/jewelry-2.svg'],
                'featured' => true,
                'is_new' => true,
                'rating' => 4.9,
            ],
            [
                'name' => 'Hoa tai ngọc đỏ',
                'slug' => 'hoa-tai-ngoc-do',
                'category_id' => $categories['hoa-tai'],
                'description' => 'Hoa tai ngọc đỏ với cấu trúc nhẹ nhàng, thêm nét rực rỡ cho trang phục tiệc.',
                'short_description' => 'Hoa tai phong cách sang trọng.',
                'price' => 980000,
                'material' => 'Ngọc đỏ và bạc',
                'color' => 'Đỏ son',
                'stock' => 10,
                'images' => ['/src/assets/jewelry-3.svg'],
                'featured' => false,
                'is_new' => true,
                'rating' => 4.6,
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(['slug' => $product['slug']], $product);
        }
    }
}
