<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankQrCode extends Model
{
    protected $fillable = ['file_name', 'mime_type', 'image_data'];

    public static function current(): ?self
    {
        return self::query()->first();
    }

    public static function publicUrl(): ?string
    {
        $qrCode = self::current();

        return $qrCode
            ? route('payments.bank-qr', ['v' => $qrCode->updated_at?->timestamp])
            : null;
    }
}
