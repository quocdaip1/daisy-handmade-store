<?php

namespace App\Http\Controllers;

use App\Models\ProductImage;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProductImageController extends Controller
{
    public function show(Request $request, string $filename): Response
    {
        $image = ProductImage::where('file_name', $filename)->firstOrFail();
        $bytes = base64_decode($image->image_data, true);
        abort_if($bytes === false, 500);
        $response = response($bytes, 200, [
            'Content-Type' => $image->mime_type,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
        $response->setEtag(hash('sha256', $bytes));
        $response->isNotModified($request);

        return $response;
    }
}
