<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutPreviewRequest extends FormRequest
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
        return [
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'address' => ['required_without:address_id', 'array'],
            'address.name' => ['required_without:address_id', 'string', 'max:255'],
            'address.phone' => ['required_without:address_id', 'string', 'regex:/^[0-9+() .-]{8,20}$/'],
            'address.city' => ['required_without:address_id', 'string', 'max:100'],
            'address.district' => ['required_without:address_id', 'string', 'max:100'],
            'address.address' => ['required_without:address_id', 'string', 'max:500'],
            'shipping_method_id' => ['required', 'integer', 'exists:shipping_methods,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'items' => ['nullable', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required_with:items', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
