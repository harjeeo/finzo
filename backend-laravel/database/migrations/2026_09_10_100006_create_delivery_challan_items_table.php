<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_challan_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('delivery_challan_id')->constrained('delivery_challans')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->string('product_name');
            $table->decimal('quantity', 14, 2);
            $table->decimal('unit_price', 14, 2);
            $table->decimal('line_total', 14, 2);

            $table->index('delivery_challan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_challan_items');
    }
};
