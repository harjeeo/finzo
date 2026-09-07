<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->string('product_name');
            $table->decimal('quantity', 14, 2);
            $table->decimal('unit_price', 14, 2);
            $table->decimal('gst_rate', 5, 2);
            $table->decimal('tax_amount', 14, 2);
            $table->decimal('line_total', 14, 2);

            $table->index('purchase_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};
