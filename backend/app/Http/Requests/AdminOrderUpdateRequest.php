<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminOrderUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(Order::STATUSES)],
            'payment_status' => ['sometimes', Rule::in(Order::PAYMENT_STATUSES)],
            'tracking_number' => ['nullable', 'string', 'max:100'],
        ];
    }
}
