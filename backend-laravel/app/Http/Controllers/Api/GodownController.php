<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Godown\CreateGodownRequest;
use App\Http\Requests\Godown\UpdateGodownRequest;
use App\Services\GodownService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GodownController extends Controller
{
    public function __construct(private readonly GodownService $godownService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->godownService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function store(CreateGodownRequest $request): JsonResponse
    {
        $godown = $this->godownService->create($this->businessId($request), $request->validated());

        return response()->json($godown, 201);
    }

    public function update(UpdateGodownRequest $request, string $id): JsonResponse
    {
        $godown = $this->godownService->update($this->businessId($request), $id, $request->validated());

        return response()->json($godown);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json($this->godownService->remove($this->businessId($request), $id));
    }
}
