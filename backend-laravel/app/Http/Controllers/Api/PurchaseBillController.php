<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\CreatePurchaseBillRequest;
use App\Http\Requests\Purchase\CreatePurchasePaymentRequest;
use App\Http\Requests\Purchase\CreatePurchaseReturnRequest;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseBillController extends Controller
{
    public function __construct(private readonly PurchaseService $purchaseService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->purchaseService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->purchaseService->findOne($this->businessId($request), $id));
    }

    public function store(CreatePurchaseBillRequest $request): JsonResponse
    {
        $bill = $this->purchaseService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($bill, 201);
    }

    public function addPayment(CreatePurchasePaymentRequest $request, string $id): JsonResponse
    {
        $bill = $this->purchaseService->addPayment($this->businessId($request), $id, $request->validated());

        return response()->json($bill);
    }

    public function createReturn(CreatePurchaseReturnRequest $request, string $id): JsonResponse
    {
        $return = $this->purchaseService->createReturn($this->businessId($request), $id, $request->validated());

        return response()->json($return);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->purchaseService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
