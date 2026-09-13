<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DiscountScheme\CreateDiscountSchemeRequest;
use App\Http\Requests\DiscountScheme\UpdateDiscountSchemeRequest;
use App\Services\DiscountSchemeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountSchemeController extends Controller
{
    public function __construct(private readonly DiscountSchemeService $discountSchemeService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->discountSchemeService->findAll($this->businessId($request)));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->discountSchemeService->findOne($this->businessId($request), $id));
    }

    public function store(CreateDiscountSchemeRequest $request): JsonResponse
    {
        $scheme = $this->discountSchemeService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($scheme, 201);
    }

    public function update(UpdateDiscountSchemeRequest $request, string $id): JsonResponse
    {
        $scheme = $this->discountSchemeService->update(
            $this->businessId($request),
            $id,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($scheme);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->discountSchemeService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
