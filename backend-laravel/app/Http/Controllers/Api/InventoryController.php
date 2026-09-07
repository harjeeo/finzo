<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockTransfer\CreateStockTransferRequest;
use App\Services\StockService;
use App\Services\StockTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly StockTransferService $stockTransferService,
    ) {}

    public function stockByProduct(Request $request, string $id): JsonResponse
    {
        return response()->json($this->stockService->getStockByProduct($this->businessId($request), $id));
    }

    public function expiryReport(Request $request): JsonResponse
    {
        $withinDays = $request->query('withinDays');

        return response()->json($this->stockService->getExpiryReport(
            $this->businessId($request),
            $withinDays !== null ? (int) $withinDays : 60,
        ));
    }

    public function listTransfers(Request $request): JsonResponse
    {
        return response()->json($this->stockTransferService->findAll($this->businessId($request)));
    }

    public function createTransfer(CreateStockTransferRequest $request): JsonResponse
    {
        $transfer = $this->stockTransferService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($transfer, 201);
    }
}
