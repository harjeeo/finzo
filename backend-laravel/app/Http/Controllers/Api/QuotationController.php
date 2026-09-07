<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotation\CreateQuotationRequest;
use App\Http\Requests\Quotation\UpdateQuotationStatusRequest;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationController extends Controller
{
    public function __construct(private readonly QuotationService $quotationService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->quotationService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->quotationService->findOne($this->businessId($request), $id));
    }

    public function store(CreateQuotationRequest $request): JsonResponse
    {
        $quotation = $this->quotationService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($quotation, 201);
    }

    public function updateStatus(UpdateQuotationStatusRequest $request, string $id): JsonResponse
    {
        $quotation = $this->quotationService->updateStatus(
            $this->businessId($request),
            $id,
            $request->validated()['status'],
            $this->actor($request),
        );

        return response()->json($quotation);
    }

    public function convert(Request $request, string $id): JsonResponse
    {
        $result = $this->quotationService->convertToInvoice($this->businessId($request), $id, $this->actor($request));

        return response()->json($result);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->quotationService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
