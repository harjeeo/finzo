<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RefreshRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        return response()->json($this->authService->register($request->validated()));
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        return response()->json($this->authService->login($data['email'], $data['password']));
    }

    public function refresh(RefreshRequest $request): JsonResponse
    {
        return response()->json($this->authService->refresh($request->validated()['refreshToken']));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->attributes->get('jwtPayload'));
    }
}
