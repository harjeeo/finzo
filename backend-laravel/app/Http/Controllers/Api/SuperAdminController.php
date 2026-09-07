<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateBusinessStatusRequest;
use App\Services\SuperAdminService;
use Illuminate\Http\JsonResponse;

class SuperAdminController extends Controller
{
    public function __construct(private readonly SuperAdminService $superAdminService) {}

    public function stats(): JsonResponse
    {
        return response()->json($this->superAdminService->getStats());
    }

    public function businesses(): JsonResponse
    {
        return response()->json($this->superAdminService->findAllBusinesses());
    }

    public function showBusiness(string $id): JsonResponse
    {
        return response()->json($this->superAdminService->findOneBusiness($id));
    }

    public function updateBusinessStatus(UpdateBusinessStatusRequest $request, string $id): JsonResponse
    {
        $business = $this->superAdminService->updateBusinessStatus($id, $request->validated()['status']);

        return response()->json($business);
    }
}
