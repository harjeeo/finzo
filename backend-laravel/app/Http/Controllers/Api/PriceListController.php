<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PriceList\CreatePriceListRequest;
use App\Http\Requests\PriceList\SetPriceListItemRequest;
use App\Http\Requests\PriceList\UpdatePriceListRequest;
use App\Services\PriceListService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceListController extends Controller
{
    public function __construct(private readonly PriceListService $priceListService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->priceListService->findAll($this->businessId($request)));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->priceListService->findOne($this->businessId($request), $id));
    }

    public function store(CreatePriceListRequest $request): JsonResponse
    {
        $priceList = $this->priceListService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($priceList, 201);
    }

    public function update(UpdatePriceListRequest $request, string $id): JsonResponse
    {
        $priceList = $this->priceListService->update(
            $this->businessId($request),
            $id,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($priceList);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->priceListService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }

    public function setItem(SetPriceListItemRequest $request, string $id, string $productId): JsonResponse
    {
        $item = $this->priceListService->setItem(
            $this->businessId($request),
            $id,
            $productId,
            $request->validated(),
        );

        return response()->json($item);
    }

    public function removeItem(Request $request, string $id, string $productId): JsonResponse
    {
        return response()->json(
            $this->priceListService->removeItem($this->businessId($request), $id, $productId),
        );
    }
}
