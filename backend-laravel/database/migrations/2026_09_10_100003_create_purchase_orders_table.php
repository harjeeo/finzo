<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches');
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->string('po_number');
            $table->timestamp('po_date')->useCurrent();
            $table->timestamp('expected_date')->nullable();
            $table->enum('status', ['DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED', 'CONVERTED'])->default('DRAFT');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('discount_total', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->string('notes')->nullable();
            $table->foreignUuid('converted_bill_id')->nullable()->unique()->constrained('purchase_bills');
            $table->timestamps();

            $table->unique(['business_id', 'po_number']);
            $table->index('business_id');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
