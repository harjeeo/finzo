<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('price', 14, 2);

            $table->unique(['price_list_id', 'product_id']);
            $table->index('price_list_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};
