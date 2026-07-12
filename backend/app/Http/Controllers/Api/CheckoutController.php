<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutPreviewRequest;
use App\Services\CheckoutPreviewService;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function preview(CheckoutPreviewRequest $request, CheckoutPreviewService $checkout): JsonResponse
    {
        return response()->json(['data' => $checkout->preview($request->user(), $request->validated())]);
    }
}
