<?php

return [
    'bank_transfer' => [
        'bank_name' => env('BANK_TRANSFER_BANK_NAME', 'MB Bank'),
        'account_number' => env('BANK_TRANSFER_ACCOUNT_NUMBER', '0349671134'),
        'account_owner' => env('BANK_TRANSFER_ACCOUNT_OWNER', 'DAISY HANDMADE STORE'),
        'transfer_prefix' => env('BANK_TRANSFER_CONTENT_PREFIX', 'DAISY'),
        'qr_image_url' => env('BANK_TRANSFER_QR_IMAGE_URL'),
    ],
];
