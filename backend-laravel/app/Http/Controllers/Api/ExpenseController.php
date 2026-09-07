<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\CreateExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Services\ExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(private readonly ExpenseService $expenseService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->expenseService->findAll($this->businessId($request), $request->query('branchId')),
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->expenseService->findOne($this->businessId($request), $id));
    }

    public function store(CreateExpenseRequest $request): JsonResponse
    {
        $expense = $this->expenseService->create($this->businessId($request), $request->validated());

        return response()->json($expense, 201);
    }

    public function update(UpdateExpenseRequest $request, string $id): JsonResponse
    {
        $expense = $this->expenseService->update($this->businessId($request), $id, $request->validated());

        return response()->json($expense);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json($this->expenseService->remove($this->businessId($request), $id));
    }
}
