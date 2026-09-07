<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches');
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->string('quotation_number');
            $table->timestamp('quotation_date')->useCurrent();
            $table->timestamp('valid_until')->nullable();
            $table->enum('status', ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'])->default('DRAFT');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('discount_total', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->string('notes')->nullable();
            $table->foreignUuid('converted_invoice_id')->nullable()->unique()->constrained('sales_invoices');
            $table->timestamps();

            $table->unique(['business_id', 'quotation_number']);
            $table->index('business_id');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
