<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->decimal('preco_custo', 10, 2)->default(0);
            $table->decimal('preco_venda', 10, 2)->default(0);
            $table->integer('quantidade')->default(0);
            $table->integer('estoque_minimo')->default(0);
            $table->string('status')->default('ativo');
            $table->foreignId('id_categoria')->constrained('product_categories');
            $table->foreignId('id_fornecedor')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('id_unidade')->constrained('units');
            $table->string('foto_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
