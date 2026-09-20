<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_qr_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('file_name');
            $table->string('mime_type', 50);
            $table->binary('image_data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_qr_codes');
    }
};
