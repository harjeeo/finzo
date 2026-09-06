<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('godown_id')->constrained('godowns')->cascadeOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained('batches')->cascadeOnDelete();
            $table->decimal('quantity', 14, 2)->default(0);
            $table->timestamp('updated_at');

            $table->unique(['product_id', 'godown_id', 'batch_id']);
            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_stocks');
    }
};
