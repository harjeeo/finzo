<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Journal\CreateJournalEntryRequest;
use App\Services\JournalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    public function __construct(private readonly JournalService $journalService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->journalService->findAll(
            $this->businessId($request),
            $request->query('from'),
            $request->query('to'),
        ));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->journalService->findOne($this->businessId($request), $id));
    }

    public function store(CreateJournalEntryRequest $request): JsonResponse
    {
        $entry = $this->journalService->createManual(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($entry, 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->journalService->removeManual($this->businessId($request), $id, $this->actor($request)),
        );
    }

    public function ledger(Request $request, string $accountId): JsonResponse
    {
        return response()->json($this->journalService->getLedger($this->businessId($request), $accountId));
    }

    public function trialBalance(Request $request): JsonResponse
    {
        return response()->json($this->journalService->getTrialBalance($this->businessId($request)));
    }
}
