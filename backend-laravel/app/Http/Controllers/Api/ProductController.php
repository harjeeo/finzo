<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\CreateProductRequest;
use App\Http\Requests\Product\CreateProductUnitRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Requests\Product\UpdateProductUnitRequest;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $productService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->productService->findAll($this->businessId($request)));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->productService->findOne($this->businessId($request), $id));
    }

    public function store(CreateProductRequest $request): JsonResponse
    {
        $product = $this->productService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($product, 201);
    }

    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        $product = $this->productService->update(
            $this->businessId($request),
            $id,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($product);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->productService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }

    public function listUnits(Request $request, string $id): JsonResponse
    {
        return response()->json($this->productService->listUnits($this->businessId($request), $id));
    }

    public function createUnit(CreateProductUnitRequest $request, string $id): JsonResponse
    {
        $unit = $this->productService->createUnit($this->businessId($request), $id, $request->validated());

        return response()->json($unit, 201);
    }

    public function updateUnit(UpdateProductUnitRequest $request, string $id, string $unitId): JsonResponse
    {
        $unit = $this->productService->updateUnit(
            $this->businessId($request),
            $id,
            $unitId,
            $request->validated(),
        );

        return response()->json($unit);
    }

    public function removeUnit(Request $request, string $id, string $unitId): JsonResponse
    {
        return response()->json(
            $this->productService->removeUnit($this->businessId($request), $id, $unitId),
        );
    }
}
