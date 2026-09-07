<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('purchase_bill_id')->constrained('purchase_bills')->cascadeOnDelete();
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->string('return_number');
            $table->timestamp('return_date')->useCurrent();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['business_id', 'return_number']);
            $table->index('business_id');
            $table->index('purchase_bill_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
