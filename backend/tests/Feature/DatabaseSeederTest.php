<?php

namespace Tests\Feature;

use App\Models\FinancialCategory;
use App\Models\ProductCategory;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_keeps_business_tables_empty(): void
    {
        $this->seed();

        $this->assertDatabaseCount('users', 4);
        $this->assertDatabaseCount('leads', 0);
        $this->assertDatabaseCount('customers', 0);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
        $this->assertDatabaseCount('financial_transactions', 0);

        $this->assertGreaterThan(0, ProductCategory::count());
        $this->assertGreaterThan(0, Unit::count());
        $this->assertGreaterThan(0, FinancialCategory::count());
    }
}
