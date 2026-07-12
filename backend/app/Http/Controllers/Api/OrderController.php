<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderIndexRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function index(OrderIndexRequest $request)
    {
        return OrderResource::collection($request->user()->orders()
            ->with(['items', 'payment'])
            ->when($request->validated('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString());
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        return new OrderResource($order->load(['items', 'payment']));
    }

    public function store(StoreOrderRequest $request, OrderService $service, PaymentService $payments): JsonResponse
    {
        $order = $service->create($request->user(), $request->validated());

        return response()->json(['message' => 'Đặt hàng thành công.', 'order' => ['customer_name' => $order->customer_name, 'customer_email' => $order->customer_email, 'customer_phone' => $order->customer_phone, 'shipping_address' => $order->shipping_address, 'total' => $order->total, 'items' => $order->items->map(fn ($item) => ['product_id' => $item->product_id, 'quantity' => $item->quantity, 'price' => $item->price])->all()], 'payment' => $payments->response($order->payment)]);
    }

    public function cancel(Order $order, OrderService $service): OrderResource
    {
        Gate::authorize('cancel', $order);

        return new OrderResource($service->cancel($order));
    }
}
