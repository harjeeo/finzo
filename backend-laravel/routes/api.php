<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryChallanController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GodownController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseBillController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\SalesInvoiceController;
use App\Http\Controllers\Api\StaffController;
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

    Route::middleware('roles:MANAGER,ACCOUNTANT')->group(function () {
        Route::get('accounts', [AccountController::class, 'index']);
        Route::get('accounts/{id}', [AccountController::class, 'show']);
        Route::post('accounts', [AccountController::class, 'store']);
        Route::patch('accounts/{id}', [AccountController::class, 'update']);
        Route::delete('accounts/{id}', [AccountController::class, 'destroy']);

        Route::get('journal/entries', [JournalController::class, 'index']);
        Route::get('journal/entries/{id}', [JournalController::class, 'show']);
        Route::post('journal/entries', [JournalController::class, 'store']);
        Route::delete('journal/entries/{id}', [JournalController::class, 'destroy']);
        Route::get('journal/ledger/{accountId}', [JournalController::class, 'ledger']);
        Route::get('journal/trial-balance', [JournalController::class, 'trialBalance']);

        Route::get('expenses', [ExpenseController::class, 'index']);
        Route::get('expenses/{id}', [ExpenseController::class, 'show']);
        Route::post('expenses', [ExpenseController::class, 'store']);
        Route::patch('expenses/{id}', [ExpenseController::class, 'update']);
        Route::delete('expenses/{id}', [ExpenseController::class, 'destroy']);
    });

    Route::get('dashboard/summary', [DashboardController::class, 'summary']);

    Route::middleware('roles:MANAGER,ACCOUNTANT')->group(function () {
        Route::get('reports/summary', [ReportsController::class, 'summary']);
        Route::get('reports/stock', [ReportsController::class, 'stock']);
        Route::get('reports/gstr1', [ReportsController::class, 'gstr1']);
        Route::get('reports/gstr1/export', [ReportsController::class, 'exportGstr1']);
        Route::get('reports/gstr3b', [ReportsController::class, 'gstr3b']);
    });

    Route::get('quotations', [QuotationController::class, 'index']);
    Route::get('quotations/{id}', [QuotationController::class, 'show']);
    Route::post('quotations', [QuotationController::class, 'store']);
    Route::patch('quotations/{id}/status', [QuotationController::class, 'updateStatus']);
    Route::post('quotations/{id}/convert', [QuotationController::class, 'convert']);
    Route::delete('quotations/{id}', [QuotationController::class, 'destroy'])->middleware('roles:MANAGER');

    Route::middleware('roles:MANAGER,ACCOUNTANT')->group(function () {
        Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
        Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
        Route::patch('purchase-orders/{id}/status', [PurchaseOrderController::class, 'updateStatus']);
        Route::post('purchase-orders/{id}/convert', [PurchaseOrderController::class, 'convert']);
        Route::delete('purchase-orders/{id}', [PurchaseOrderController::class, 'destroy']);
    });

    Route::get('delivery-challans', [DeliveryChallanController::class, 'index']);
    Route::get('delivery-challans/{id}', [DeliveryChallanController::class, 'show']);
    Route::post('delivery-challans', [DeliveryChallanController::class, 'store']);
    Route::patch('delivery-challans/{id}/status', [DeliveryChallanController::class, 'updateStatus']);
    Route::delete('delivery-challans/{id}', [DeliveryChallanController::class, 'destroy']);

    Route::get('branches', [BranchController::class, 'index']);
    Route::post('branches', [BranchController::class, 'store'])->middleware('roles:MANAGER');
    Route::patch('branches/{id}', [BranchController::class, 'update'])->middleware('roles:MANAGER');
    Route::delete('branches/{id}', [BranchController::class, 'destroy'])->middleware('roles:MANAGER');

    Route::get('godowns', [GodownController::class, 'index']);
    Route::post('godowns', [GodownController::class, 'store'])->middleware('roles:MANAGER');
    Route::patch('godowns/{id}', [GodownController::class, 'update'])->middleware('roles:MANAGER');
    Route::delete('godowns/{id}', [GodownController::class, 'destroy'])->middleware('roles:MANAGER');

    Route::get('business', [BusinessController::class, 'show']);
    Route::patch('business', [BusinessController::class, 'update'])->middleware('roles');

    Route::get('staff', [StaffController::class, 'index'])->middleware('roles:MANAGER');
    Route::post('staff', [StaffController::class, 'store'])->middleware('roles');
    Route::patch('staff/{id}', [StaffController::class, 'update'])->middleware('roles');
    Route::delete('staff/{id}', [StaffController::class, 'destroy'])->middleware('roles');
});
