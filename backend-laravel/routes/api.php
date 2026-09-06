<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
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

    Route::get('suppliers', [SupplierController::class, 'index']);
    Route::get('suppliers/{id}', [SupplierController::class, 'show']);
    Route::post('suppliers', [SupplierController::class, 'store'])->middleware('roles:MANAGER');
    Route::patch('suppliers/{id}', [SupplierController::class, 'update'])->middleware('roles:MANAGER');
    Route::delete('suppliers/{id}', [SupplierController::class, 'destroy'])->middleware('roles:MANAGER');
});
