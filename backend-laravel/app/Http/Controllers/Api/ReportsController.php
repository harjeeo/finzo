<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GstrService;
use App\Services\ReportsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportsController extends Controller
{
    public function __construct(
        private readonly ReportsService $reportsService,
        private readonly GstrService $gstrService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getSummary(
            $this->businessId($request),
            $request->query('from'),
            $request->query('to'),
            $request->query('branchId'),
        ));
    }

    public function stock(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getStockReport($this->businessId($request)));
    }

    public function gstr1(Request $request): JsonResponse
    {
        return response()->json($this->gstrService->getGstr1(
            $this->businessId($request),
            $request->query('from'),
            $request->query('to'),
        ));
    }

    public function exportGstr1(Request $request): Response
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $report = $this->gstrService->getGstr1($this->businessId($request), $from, $to);
        $csv = $this->gstrService->toCsv($report);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="GSTR1_'.($from ?? 'all').'_'.($to ?? 'all').'.csv"',
        ]);
    }

    public function gstr3b(Request $request): JsonResponse
    {
        return response()->json($this->gstrService->getGstr3bSummary(
            $this->businessId($request),
            $request->query('from'),
            $request->query('to'),
        ));
    }
}
