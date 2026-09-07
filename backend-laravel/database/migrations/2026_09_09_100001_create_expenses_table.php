<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches');
            $table->string('category');
            $table->decimal('amount', 14, 2);
            $table->string('payment_mode')->default('CASH');
            $table->string('reference')->nullable();
            $table->timestamp('expense_date')->useCurrent();
            $table->timestamps();

            $table->index('business_id');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
