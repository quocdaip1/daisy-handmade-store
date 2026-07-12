<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CommerceController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/new-arrivals', [ProductController::class, 'newArrivals']);
Route::get('/products/best-sellers', [ProductController::class, 'bestSellers']);
Route::get('/products/{slug}/related', [ProductController::class, 'related']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category:slug}', [CategoryController::class, 'show']);
Route::post('/coupons/validate', [CouponController::class, 'validateCoupon']);
Route::post('/shipping/quote', [CommerceController::class, 'shipping']);
Route::post('/contacts', [CommerceController::class, 'contact'])->middleware('throttle:5,1');
Route::get('/policies', [CommerceController::class, 'policies']);
Route::get('/policies/{policy:slug}', [CommerceController::class, 'policy']);
Route::get('/banners', [CommerceController::class, 'banners']);

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout/preview', [CheckoutController::class, 'preview']);
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::patch('/cart/items/{cartItem}', [CartController::class, 'update']);
    Route::delete('/cart/items/{cartItem}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::apiResource('addresses', AddressController::class)->except(['show']);

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/customers', [AdminController::class, 'customers']);
        Route::get('/customers/{customer}', [AdminController::class, 'showCustomer']);
        Route::put('/customers/{customer}', [AdminController::class, 'updateCustomer']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/orders/{order}', [AdminController::class, 'showOrder']);
        Route::patch('/orders/{order}', [AdminController::class, 'updateOrder']);
        Route::get('/products', [AdminController::class, 'products']);
        Route::get('/products/{product}', [AdminController::class, 'showProduct']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::put('/products/{product}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{product}', [AdminController::class, 'destroyProduct']);
        Route::post('/products/{product}/images', [AdminController::class, 'upload']);
        Route::post('/categories', [AdminController::class, 'storeCategory']);
        Route::get('/categories', [AdminController::class, 'categories']);
        Route::get('/categories/{category}', [AdminController::class, 'showCategory']);
        Route::put('/categories/{category}', [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [AdminController::class, 'destroyCategory']);
        Route::get('/coupons', [AdminController::class, 'coupons']);
        Route::get('/coupons/{coupon}', [AdminController::class, 'showCoupon']);
        Route::post('/coupons', [AdminController::class, 'storeCoupon']);
        Route::put('/coupons/{coupon}', [AdminController::class, 'updateCoupon']);
        Route::delete('/coupons/{coupon}', [AdminController::class, 'destroyCoupon']);
    });
});

Route::get('/health', fn () => response()->json(['status' => 'ok']));
