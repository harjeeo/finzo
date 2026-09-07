<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\CreateAccountRequest;
use App\Http\Requests\Account\UpdateAccountRequest;
use App\Services\AccountsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(private readonly AccountsService $accountsService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->accountsService->findAll($this->businessId($request)));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->accountsService->findOne($this->businessId($request), $id));
    }

    public function store(CreateAccountRequest $request): JsonResponse
    {
        $account = $this->accountsService->create($this->businessId($request), $request->validated());

        return response()->json($account, 201);
    }

    public function update(UpdateAccountRequest $request, string $id): JsonResponse
    {
        $account = $this->accountsService->update($this->businessId($request), $id, $request->validated());

        return response()->json($account);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json($this->accountsService->remove($this->businessId($request), $id));
    }
}
