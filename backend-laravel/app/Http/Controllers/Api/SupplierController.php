<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\CreateSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function __construct(private readonly SupplierService $supplierService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->supplierService->findAll($this->businessId($request)));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->supplierService->findOne($this->businessId($request), $id));
    }

    public function store(CreateSupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($supplier, 201);
    }

    public function update(UpdateSupplierRequest $request, string $id): JsonResponse
    {
        $supplier = $this->supplierService->update(
            $this->businessId($request),
            $id,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($supplier);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->supplierService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }

    public function ledger(Request $request, string $id): JsonResponse
    {
        return response()->json($this->supplierService->getLedger($this->businessId($request), $id));
    }
}
