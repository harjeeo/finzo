<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eway_bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('sales_invoice_id')->unique()->constrained('sales_invoices')->cascadeOnDelete();
            $table->string('ewb_number')->nullable();
            $table->string('transporter_name')->nullable();
            $table->string('transporter_id')->nullable();
            $table->string('vehicle_number')->nullable();
            $table->enum('transport_mode', ['ROAD', 'RAIL', 'AIR', 'SHIP'])->default('ROAD');
            $table->integer('distance_km');
            $table->timestamp('valid_until');
            $table->enum('status', ['GENERATED', 'CANCELLED'])->default('GENERATED');
            $table->timestamps();

            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eway_bills');
    }
};
