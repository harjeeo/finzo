<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reconciliation\SetReconciledRequest;
use App\Services\ReconciliationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReconciliationController extends Controller
{
    public function __construct(private readonly ReconciliationService $reconciliationService) {}

    public function accounts(Request $request): JsonResponse
    {
        return response()->json($this->reconciliationService->listBankAccounts($this->businessId($request)));
    }

    public function show(Request $request, string $accountId): JsonResponse
    {
        return response()->json($this->reconciliationService->getReconciliation($this->businessId($request), $accountId));
    }

    public function setReconciled(SetReconciledRequest $request, string $accountId, string $lineId): JsonResponse
    {
        $line = $this->reconciliationService->setReconciled(
            $this->businessId($request),
            $accountId,
            $lineId,
            $request->validated()['reconciled'],
        );

        return response()->json($line);
    }
}
