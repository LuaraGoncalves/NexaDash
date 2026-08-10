<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinancialCategoryController;
use App\Http\Controllers\FinancialTransactionController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadMessageController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserManagementController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('api.auth')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::prefix('crm')->group(function () {
        Route::middleware('role:admin,employee')->group(function () {
            Route::get('/leads', [LeadController::class, 'index']);
            Route::post('/leads', [LeadController::class, 'store']);
            Route::put('/leads/{id}', [LeadController::class, 'update']);
            Route::delete('/leads/{id}', [LeadController::class, 'destroy']);
            Route::get('/leads/{id}/messages', [LeadMessageController::class, 'index']);
            Route::post('/leads/{id}/messages', [LeadMessageController::class, 'store']);

            Route::get('/sales', [SaleController::class, 'index']);
            Route::post('/sales', [SaleController::class, 'store']);
            Route::put('/sales/{id}', [SaleController::class, 'update']);
            Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
            Route::get('/customers', [CustomerController::class, 'index']);
            Route::post('/customers', [CustomerController::class, 'store']);
            Route::put('/customers/{id}', [CustomerController::class, 'update']);
        });

        Route::middleware('role:admin')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);

            Route::get('/products', [ProductController::class, 'index']);
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{id}', [ProductController::class, 'update']);
            Route::delete('/products/{id}', [ProductController::class, 'destroy']);

            Route::get('/product-categories', [ProductCategoryController::class, 'index']);
            Route::post('/product-categories', [ProductCategoryController::class, 'store']);
            Route::put('/product-categories/{id}', [ProductCategoryController::class, 'update']);
            Route::delete('/product-categories/{id}', [ProductCategoryController::class, 'destroy']);

            Route::get('/suppliers', [SupplierController::class, 'index']);
            Route::post('/suppliers', [SupplierController::class, 'store']);
            Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
            Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

            Route::get('/units', [UnitController::class, 'index']);
            Route::post('/units', [UnitController::class, 'store']);
            Route::put('/units/{id}', [UnitController::class, 'update']);
            Route::delete('/units/{id}', [UnitController::class, 'destroy']);

            Route::get('/inventory-movements', [InventoryMovementController::class, 'index']);
            Route::post('/inventory-movements', [InventoryMovementController::class, 'store']);
            Route::put('/inventory-movements/{id}', [InventoryMovementController::class, 'update']);
            Route::delete('/inventory-movements/{id}', [InventoryMovementController::class, 'destroy']);

            Route::get('/financial/categories', [FinancialCategoryController::class, 'index']);
            Route::post('/financial/categories', [FinancialCategoryController::class, 'store']);
            Route::put('/financial/categories/{id}', [FinancialCategoryController::class, 'update']);
            Route::delete('/financial/categories/{id}', [FinancialCategoryController::class, 'destroy']);

            Route::get('/financial/transactions', [FinancialTransactionController::class, 'index']);
            Route::post('/financial/transactions', [FinancialTransactionController::class, 'store']);
            Route::put('/financial/transactions/{id}', [FinancialTransactionController::class, 'update']);
            Route::delete('/financial/transactions/{id}', [FinancialTransactionController::class, 'destroy']);

            Route::get('/users', [UserManagementController::class, 'index']);
            Route::post('/users', [UserManagementController::class, 'store']);
            Route::put('/users/{id}', [UserManagementController::class, 'update']);
            Route::delete('/users/{id}', [UserManagementController::class, 'destroy']);

            Route::get('/audit-logs', [AuditLogController::class, 'index']);

            Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
        });
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('api.auth');
