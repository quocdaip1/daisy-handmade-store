<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('inventory_mode', 20)->default('shared');
            $table->string('cover_image', 2048)->nullable();
        });
        Schema::create('product_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('color_name', 100);
            $table->unsignedInteger('stock')->nullable();
            $table->json('images')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['product_id', 'color_name']);
        });
        Schema::table('cart_items', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'product_id']);
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->restrictOnDelete();
        });
        // Separate partial indexes also protect legacy rows with NULL variant_id.
        DB::statement('CREATE UNIQUE INDEX cart_items_shared_unique ON cart_items (user_id, product_id) WHERE variant_id IS NULL');
        DB::statement('CREATE UNIQUE INDEX cart_items_variant_unique ON cart_items (user_id, product_id, variant_id) WHERE variant_id IS NOT NULL');
        Schema::table('order_items', function (Blueprint $table): void {
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->restrictOnDelete();
            $table->string('color_name', 100)->nullable();
            $table->string('inventory_source', 20)->default('shared');
        });
    }

    public function down(): void
    {
        if (DB::table('order_items')->whereNotNull('variant_id')->exists()
            || DB::table('cart_items')->whereNotNull('variant_id')->exists()) {
            throw new LogicException('Variant references exist. Restore a verified backup instead of discarding color history.');
        }
        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropForeign(['variant_id']);
            $table->dropColumn(['variant_id', 'color_name', 'inventory_source']);
        });
        DB::statement('DROP INDEX cart_items_shared_unique');
        DB::statement('DROP INDEX cart_items_variant_unique');
        Schema::table('cart_items', function (Blueprint $table): void {
            $table->dropForeign(['variant_id']);
            $table->dropColumn('variant_id');
        });
        // A rollback must not merge distinct purchased colors silently.
        Schema::table('cart_items', fn (Blueprint $table) => $table->unique(['user_id', 'product_id']));
        Schema::dropIfExists('product_variants');
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['inventory_mode', 'cover_image']));
    }
};
