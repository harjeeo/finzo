<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CreateCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $customerService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->customerService->findAll($this->businessId($request)));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->customerService->findOne($this->businessId($request), $id));
    }

    public function store(CreateCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create(
            $this->businessId($request),
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($customer, 201);
    }

    public function update(UpdateCustomerRequest $request, string $id): JsonResponse
    {
        $customer = $this->customerService->update(
            $this->businessId($request),
            $id,
            $request->validated(),
            $this->actor($request),
        );

        return response()->json($customer);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(
            $this->customerService->remove($this->businessId($request), $id, $this->actor($request)),
        );
    }
}
