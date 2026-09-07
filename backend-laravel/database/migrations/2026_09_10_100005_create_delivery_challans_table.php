<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_challans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches');
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->foreignUuid('sales_invoice_id')->nullable()->constrained('sales_invoices');
            $table->string('challan_number');
            $table->timestamp('challan_date')->useCurrent();
            $table->string('vehicle_number')->nullable();
            $table->string('transporter_name')->nullable();
            $table->enum('status', ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])->default('DRAFT');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'challan_number']);
            $table->index('business_id');
            $table->index('branch_id');
            $table->index('sales_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_challans');
    }
};
