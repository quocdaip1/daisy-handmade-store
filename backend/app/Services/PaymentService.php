<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function createForOrder(Order $order): Payment
    {
        $metadata = $order->payment_method === 'bank_transfer'
            ? $this->bankTransferMetadata($order)
            : null;

        return $order->payment()->create([
            'method' => $order->payment_method,
            'status' => $order->payment_status,
            'amount' => $order->total,
            'metadata' => $metadata,
        ]);
    }

    public function response(Payment $payment): array
    {
        $response = [
            'method' => $payment->method,
            'status' => $payment->status,
            'amount' => $payment->amount,
        ];

        return $payment->method === 'bank_transfer'
            ? array_merge($response, $payment->metadata ?? [])
            : $response;
    }

    private function bankTransferMetadata(Order $order): array
    {
        $config = config('payments.bank_transfer');
        foreach (['bank_name', 'account_number', 'account_owner', 'transfer_prefix'] as $field) {
            if (blank($config[$field] ?? null)) {
                throw ValidationException::withMessages([
                    'payment_method' => 'Thông tin chuyển khoản chưa được cấu hình đầy đủ.',
                ]);
            }
        }

        return [
            'bank_name' => $config['bank_name'],
            'account_number' => $config['account_number'],
            'account_owner' => $config['account_owner'],
            'transfer_content' => trim($config['transfer_prefix'].' '.$order->number),
            'qr_image_url' => $config['qr_image_url'] ?: null,
        ];
    }
}
