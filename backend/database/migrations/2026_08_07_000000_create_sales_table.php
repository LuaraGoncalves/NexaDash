<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('protocolo')->unique()->nullable();
            $table->foreignId('id_cliente')->nullable()->index();
            $table->string('cliente_nome');
            $table->string('data_hora');
            $table->decimal('total', 10, 2);
            $table->string('forma_pagamento');
            $table->string('status')->default('Aberta');
            $table->json('itens');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
