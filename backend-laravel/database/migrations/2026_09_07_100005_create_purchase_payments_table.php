<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_bill_id')->constrained('purchase_bills')->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('payment_mode')->default('CASH');
            $table->string('reference')->nullable();
            $table->timestamp('payment_date')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->index('purchase_bill_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_payments');
    }
};
