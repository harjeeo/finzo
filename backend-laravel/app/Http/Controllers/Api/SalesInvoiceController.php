<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\CreateSalesInvoiceRequest;
use App\Http\Requests\Sales\CreateSalesPaymentRequest;
use App\Http\Requests\Sales\CreateSalesReturnRequest;
use App\Services\SalesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesInvoiceController extends Controller
{
    public function __construct(private readonly SalesService $salesService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->salesService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->salesService->findOne($this->businessId($request), $id));
    }

    public function store(CreateSalesInvoiceRequest $request): JsonResponse
    {
        $invoice = $this->salesService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($invoice, 201);
    }

    public function addPayment(CreateSalesPaymentRequest $request, string $id): JsonResponse
    {
        $invoice = $this->salesService->addPayment($this->businessId($request), $id, $request->validated());

        return response()->json($invoice);
    }

    public function createReturn(CreateSalesReturnRequest $request, string $id): JsonResponse
    {
        $return = $this->salesService->createReturn($this->businessId($request), $id, $request->validated());

        return response()->json($return);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->salesService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
