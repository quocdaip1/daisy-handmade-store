<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductImageController;

Route::get('/storage/products/{filename}', [ProductImageController::class, 'show'])
    ->where('filename', '[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)');

Route::get('/', function () {
    return view('welcome');
});
