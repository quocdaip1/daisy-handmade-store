<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cart) {}

    public function index(Request $request): CartResource
    {
        return new CartResource($this->cart->items($request->user()));
    }

    public function store(StoreCartItemRequest $request): CartResource
    {
        $data = $request->validated();

        return new CartResource($this->cart->add($request->user(), $data['product_id'], $data['quantity']));
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem): CartResource
    {
        return new CartResource($this->cart->update($request->user(), $cartItem, $request->integer('quantity')));
    }

    public function destroy(Request $request, CartItem $cartItem): CartResource
    {
        return new CartResource($this->cart->remove($request->user(), $cartItem));
    }

    public function clear(Request $request): JsonResponse
    {
        $this->cart->clear($request->user());

        return response()->json(['data' => ['items' => [], 'item_count' => 0, 'subtotal' => 0]]);
    }
}
