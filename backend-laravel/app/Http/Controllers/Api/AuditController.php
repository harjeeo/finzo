<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->auditService->findAll($this->businessId($request), [
            'entityType' => $request->query('entityType'),
            'entityId' => $request->query('entityId'),
            'from' => $request->query('from'),
            'to' => $request->query('to'),
        ]));
    }
}
