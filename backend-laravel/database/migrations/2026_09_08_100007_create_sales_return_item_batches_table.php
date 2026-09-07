<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_return_item_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_return_item_id')->constrained('sales_return_items')->cascadeOnDelete();
            $table->foreignUuid('batch_id')->constrained('batches');
            $table->decimal('quantity', 14, 2);

            $table->index('sales_return_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_return_item_batches');
    }
};
