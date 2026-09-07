<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EwayBill\CreateEwayBillRequest;
use App\Http\Requests\EwayBill\UpdateEwayBillRequest;
use App\Services\EwayBillService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EwayBillController extends Controller
{
    public function __construct(private readonly EwayBillService $ewayBillService) {}

    public function show(Request $request, string $invoiceId)
    {
        $ewayBill = $this->ewayBillService->findByInvoice($this->businessId($request), $invoiceId);

        // response()->json(null) serializes to "{}" (a Symfony JsonResponse quirk:
        // a null $data argument is treated as "not provided"), but the frontend
        // contract is EwayBill | null — encode the literal null body ourselves.
        if ($ewayBill === null) {
            return response('null', 200, ['Content-Type' => 'application/json']);
        }

        return response()->json($ewayBill);
    }

    public function generate(CreateEwayBillRequest $request, string $invoiceId): JsonResponse
    {
        $ewayBill = $this->ewayBillService->generate(
            $this->businessId($request),
            $invoiceId,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($ewayBill);
    }

    public function update(UpdateEwayBillRequest $request, string $invoiceId): JsonResponse
    {
        $ewayBill = $this->ewayBillService->update(
            $this->businessId($request),
            $invoiceId,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($ewayBill);
    }

    public function cancel(Request $request, string $invoiceId): JsonResponse
    {
        $ewayBill = $this->ewayBillService->cancel($this->businessId($request), $invoiceId, $this->actor($request));

        return response()->json($ewayBill);
    }
}
