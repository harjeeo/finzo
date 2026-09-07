<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeliveryChallan\CreateDeliveryChallanRequest;
use App\Http\Requests\DeliveryChallan\UpdateDeliveryChallanStatusRequest;
use App\Services\DeliveryChallanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryChallanController extends Controller
{
    public function __construct(private readonly DeliveryChallanService $deliveryChallanService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->deliveryChallanService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->deliveryChallanService->findOne($this->businessId($request), $id));
    }

    public function store(CreateDeliveryChallanRequest $request): JsonResponse
    {
        $challan = $this->deliveryChallanService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($challan, 201);
    }

    public function updateStatus(UpdateDeliveryChallanStatusRequest $request, string $id): JsonResponse
    {
        $challan = $this->deliveryChallanService->updateStatus(
            $this->businessId($request),
            $id,
            $request->validated()['status'],
            $this->actor($request),
        );

        return response()->json($challan);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->deliveryChallanService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
