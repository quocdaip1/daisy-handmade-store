<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Trâm cài tóc', 'slug' => 'tram-cai-toc', 'description' => 'Những món phụ kiện tinh xảo cho tóc.'],
            ['name' => 'Kiềng cổ', 'slug' => 'kieng-co', 'description' => 'Kiềng cổ mang nét cổ điển và sang trọng.'],
            ['name' => 'Hoa tai', 'slug' => 'hoa-tai', 'description' => 'Hoa tai đính đá và ngọc, phù hợp nhiều phong cách.'],
            ['name' => 'Vòng tay', 'slug' => 'vong-tay', 'description' => 'Các thiết kế vòng tay mềm mại và thanh lịch.'],
            ['name' => 'Nhẫn', 'slug' => 'nhan', 'description' => 'Nhẫn truyền thống kết hợp hiện đại.'],
            ['name' => 'Phụ kiện áo', 'slug' => 'phu-kien-ao', 'description' => 'Phụ kiện hoàn thiện bộ trang phục.'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
