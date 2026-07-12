<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('coupon_code')) {
            $this->merge(['coupon_code' => strtoupper(trim((string) $this->input('coupon_code')))]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['items' => ['required', 'array', 'min:1', 'max:50'], 'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'], 'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'], 'customer_name' => ['required', 'string', 'max:255'], 'customer_email' => ['required', 'email', 'max:255'], 'customer_phone' => ['required', 'string', 'max:20'], 'shipping_address' => ['required', 'string', 'max:1000'], 'note' => ['nullable', 'string', 'max:2000'], 'payment_method' => ['sometimes', 'in:cod,bank_transfer'], 'coupon_code' => ['nullable', 'string', 'max:50'], 'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id']];
    }
}
