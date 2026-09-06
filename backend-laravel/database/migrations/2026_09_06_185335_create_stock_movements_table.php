<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('godown_id')->constrained('godowns')->cascadeOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained('batches');
            $table->decimal('quantity', 14, 2);
            $table->enum('source_type', [
                'PURCHASE', 'PURCHASE_RETURN', 'SALES', 'SALES_RETURN',
                'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT',
            ]);
            $table->string('source_id')->nullable();
            $table->string('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('business_id');
            $table->index(['product_id', 'godown_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
