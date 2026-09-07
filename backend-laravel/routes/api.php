<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseBillController;
use App\Http\Controllers\Api\SalesInvoiceController;
use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/refresh', [AuthController::class, 'refresh']);
Route::get('auth/me', [AuthController::class, 'me'])->middleware('jwt.auth');

Route::middleware('jwt.auth')->group(function () {
    Route::get('customers', [CustomerController::class, 'index']);
    Route::get('customers/{id}', [CustomerController::class, 'show']);
    Route::post('customers', [CustomerController::class, 'store'])->middleware('roles:MANAGER,CASHIER');
    Route::patch('customers/{id}', [CustomerController::class, 'update'])->middleware('roles:MANAGER');
    Route::delete('customers/{id}', [CustomerController::class, 'destroy'])->middleware('roles:MANAGER');
    Route::get('customers/{id}/ledger', [CustomerController::class, 'ledger']);

    Route::get('suppliers', [SupplierController::class, 'index']);
    Route::get('suppliers/{id}', [SupplierController::class, 'show']);
    Route::post('suppliers', [SupplierController::class, 'store'])->middleware('roles:MANAGER');
    Route::patch('suppliers/{id}', [SupplierController::class, 'update'])->middleware('roles:MANAGER');
    Route::delete('suppliers/{id}', [SupplierController::class, 'destroy'])->middleware('roles:MANAGER');
    Route::get('suppliers/{id}/ledger', [SupplierController::class, 'ledger']);

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{id}', [ProductController::class, 'show']);
    Route::post('products', [ProductController::class, 'store'])->middleware('roles:MANAGER');
    Route::patch('products/{id}', [ProductController::class, 'update'])->middleware('roles:MANAGER');
    Route::delete('products/{id}', [ProductController::class, 'destroy'])->middleware('roles:MANAGER');

    Route::get('products/{id}/units', [ProductController::class, 'listUnits']);
    Route::post('products/{id}/units', [ProductController::class, 'createUnit'])->middleware('roles:MANAGER');
    Route::patch('products/{id}/units/{unitId}', [ProductController::class, 'updateUnit'])->middleware('roles:MANAGER');
    Route::delete('products/{id}/units/{unitId}', [ProductController::class, 'removeUnit'])->middleware('roles:MANAGER');

    Route::middleware('roles:MANAGER,ACCOUNTANT')->group(function () {
        Route::get('purchase-bills', [PurchaseBillController::class, 'index']);
        Route::get('purchase-bills/{id}', [PurchaseBillController::class, 'show']);
        Route::post('purchase-bills', [PurchaseBillController::class, 'store']);
        Route::post('purchase-bills/{id}/payments', [PurchaseBillController::class, 'addPayment']);
        Route::post('purchase-bills/{id}/returns', [PurchaseBillController::class, 'createReturn']);
        Route::delete('purchase-bills/{id}', [PurchaseBillController::class, 'destroy']);
    });

    Route::get('sales-invoices', [SalesInvoiceController::class, 'index']);
    Route::get('sales-invoices/{id}', [SalesInvoiceController::class, 'show']);
    Route::post('sales-invoices', [SalesInvoiceController::class, 'store']);
    Route::post('sales-invoices/{id}/payments', [SalesInvoiceController::class, 'addPayment']);
    Route::post('sales-invoices/{id}/returns', [SalesInvoiceController::class, 'createReturn'])->middleware('roles:MANAGER');
    Route::delete('sales-invoices/{id}', [SalesInvoiceController::class, 'destroy'])->middleware('roles:MANAGER');
});
