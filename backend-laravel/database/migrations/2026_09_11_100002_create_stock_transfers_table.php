<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('batch_id')->nullable()->constrained('batches');
            $table->foreignUuid('from_godown_id')->constrained('godowns');
            $table->foreignUuid('to_godown_id')->constrained('godowns');
            $table->decimal('quantity', 14, 2);
            $table->string('notes')->nullable();
            $table->timestamp('transfer_date')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
