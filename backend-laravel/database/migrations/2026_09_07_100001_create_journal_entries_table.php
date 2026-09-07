<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('entry_number');
            $table->timestamp('entry_date')->useCurrent();
            $table->string('narration')->nullable();
            $table->enum('source_type', [
                'MANUAL', 'SALES_INVOICE', 'SALES_PAYMENT', 'SALES_RETURN',
                'PURCHASE_BILL', 'PURCHASE_PAYMENT', 'PURCHASE_RETURN', 'EXPENSE',
            ])->default('MANUAL');
            $table->uuid('source_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['business_id', 'entry_number']);
            $table->index('business_id');
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
