<?php

return [
    // Database storage survives restarts on hosts with ephemeral local disks.
    'storage' => env('PRODUCT_IMAGE_STORAGE', 'database'),
];
