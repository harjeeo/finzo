<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\CreateBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Services\BranchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function __construct(private readonly BranchService $branchService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->branchService->findAll($this->businessId($request)));
    }

    public function store(CreateBranchRequest $request): JsonResponse
    {
        $branch = $this->branchService->create($this->businessId($request), $request->validated());

        return response()->json($branch, 201);
    }

    public function update(UpdateBranchRequest $request, string $id): JsonResponse
    {
        $branch = $this->branchService->update($this->businessId($request), $id, $request->validated());

        return response()->json($branch);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json($this->branchService->remove($this->businessId($request), $id));
    }
}
