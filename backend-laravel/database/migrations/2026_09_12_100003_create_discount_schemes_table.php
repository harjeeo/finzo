<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_schemes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('name');
            $table->enum('discount_type', ['PERCENTAGE', 'FLAT']);
            $table->decimal('value', 14, 2);
            $table->foreignUuid('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->decimal('min_quantity', 14, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('business_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_schemes');
    }
};
