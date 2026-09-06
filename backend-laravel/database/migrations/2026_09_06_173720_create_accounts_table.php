<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('code');
            $table->string('name');
            $table->enum('type', ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_bank_account')->default(false);
            $table->decimal('opening_balance', 14, 2)->default(0);
            $table->timestamps();

            $table->unique(['business_id', 'code']);
            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
