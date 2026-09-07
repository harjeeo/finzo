<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches');
            $table->foreignUuid('godown_id')->nullable()->constrained('godowns');
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->string('bill_number');
            $table->timestamp('bill_date')->useCurrent();
            $table->enum('status', ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'])->default('DRAFT');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('discount_total', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->timestamps();

            $table->unique(['business_id', 'bill_number']);
            $table->index('business_id');
            $table->index('branch_id');
            $table->index('godown_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_bills');
    }
};
