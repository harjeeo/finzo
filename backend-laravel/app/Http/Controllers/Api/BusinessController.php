<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\UpdateBusinessRequest;
use App\Services\BusinessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    public function __construct(private readonly BusinessService $businessService) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->businessService->findOne($this->businessId($request)));
    }

    public function update(UpdateBusinessRequest $request): JsonResponse
    {
        $business = $this->businessService->update(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($business);
    }
}
