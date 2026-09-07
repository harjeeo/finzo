<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseOrder\CreatePurchaseOrderRequest;
use App\Http\Requests\PurchaseOrder\UpdatePurchaseOrderStatusRequest;
use App\Services\PurchaseOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    public function __construct(private readonly PurchaseOrderService $purchaseOrderService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->purchaseOrderService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->purchaseOrderService->findOne($this->businessId($request), $id));
    }

    public function store(CreatePurchaseOrderRequest $request): JsonResponse
    {
        $po = $this->purchaseOrderService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($po, 201);
    }

    public function updateStatus(UpdatePurchaseOrderStatusRequest $request, string $id): JsonResponse
    {
        $po = $this->purchaseOrderService->updateStatus(
            $this->businessId($request),
            $id,
            $request->validated()['status'],
            $this->actor($request),
        );

        return response()->json($po);
    }

    public function convert(Request $request, string $id): JsonResponse
    {
        $result = $this->purchaseOrderService->convertToBill($this->businessId($request), $id, $this->actor($request));

        return response()->json($result);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->purchaseOrderService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
