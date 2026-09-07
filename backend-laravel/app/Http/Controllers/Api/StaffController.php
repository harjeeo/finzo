<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\CreateStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Services\StaffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(private readonly StaffService $staffService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->staffService->findAll($this->businessId($request)));
    }

    public function store(CreateStaffRequest $request): JsonResponse
    {
        $membership = $this->staffService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($membership, 201);
    }

    public function update(UpdateStaffRequest $request, string $id): JsonResponse
    {
        $membership = $this->staffService->update(
            $this->businessId($request),
            $id,
            $request->validated()['role'],
            $this->actor($request),
        );

        return response()->json($membership);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->staffService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
