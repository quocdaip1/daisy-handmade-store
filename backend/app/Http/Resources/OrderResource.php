<?php

namespace App\Http\Resources;

use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'number' => $this->number, 'status' => $this->status, 'payment_method' => $this->payment_method, 'payment_status' => $this->payment_status, 'customer_name' => $this->customer_name, 'customer_email' => $this->customer_email, 'customer_phone' => $this->customer_phone, 'shipping_address' => $this->shipping_address, 'subtotal' => $this->subtotal, 'discount' => $this->discount, 'shipping_fee' => $this->shipping_fee, 'total' => $this->total, 'tracking_number' => $this->tracking_number, 'items' => $this->whenLoaded('items'), 'payment' => $this->whenLoaded('payment', fn () => app(PaymentService::class)->response($this->payment)), 'created_at' => $this->created_at];
    }
}
