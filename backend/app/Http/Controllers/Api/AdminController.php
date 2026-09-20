<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminBannerRequest;
use App\Http\Requests\AdminCategoryRequest;
use App\Http\Requests\AdminCouponRequest;
use App\Http\Requests\AdminCustomerUpdateRequest;
use App\Http\Requests\AdminOrderUpdateRequest;
use App\Http\Requests\AdminPolicyRequest;
use App\Http\Requests\AdminProductRequest;
use App\Http\Resources\AdminCategoryResource;
use App\Http\Resources\AdminProductResource;
use App\Http\Resources\OrderResource;
use App\Models\Banner;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Policy;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    public function access(): JsonResponse
    {
        return response()->json(['data' => ['allowed' => true]]);
    }

    public function dashboard(): JsonResponse
    {
        $bestSellers = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.payment_status', 'paid')
            ->select(['order_items.product_id', 'order_items.product_name', 'order_items.product_sku'])
            ->selectRaw('SUM(order_items.quantity) as quantity_sold')
            ->selectRaw('SUM(order_items.total) as revenue')
            ->groupBy('order_items.product_id', 'order_items.product_name', 'order_items.product_sku')
            ->orderByDesc('quantity_sold')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn (OrderItem $item) => [
                'product_id' => $item->product_id,
                'name' => $item->product_name,
                'sku' => $item->product_sku,
                'quantity_sold' => (int) $item->quantity_sold,
                'revenue' => (int) $item->revenue,
            ]);

        return response()->json(['data' => [
            'revenue' => Order::query()->where('payment_status', 'paid')->sum('total'),
            'orders' => Order::query()->count(),
            'orders_by_status' => Order::query()->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status'),
            'customers' => User::query()->where('role', 'customer')->count(),
            'products' => Product::query()->count(),
            'published_products' => Product::query()->where('status', 'published')->count(),
            'low_stock_products' => Product::query()->where('status', 'published')->where('stock', '<=', 5)->count(),
            'active_coupons' => Coupon::query()->where('active', true)->count(),
            'best_sellers' => $bestSellers,
        ]]);
    }

    public function customers(Request $request): JsonResponse
    {
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);
        $customers = User::query()->where('role', 'customer')
            ->when($data['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
            ->withCount('orders')->latest()->paginate($request->integer('per_page', 15))->withQueryString();

        return response()->json($customers);
    }

    public function showCustomer(User $customer): JsonResponse
    {
        abort_unless($customer->role === 'customer', 404);

        return response()->json(['data' => $customer->load(['addresses', 'orders' => fn ($query) => $query->latest()])->loadCount('orders')]);
    }

    public function updateCustomer(AdminCustomerUpdateRequest $request, User $customer): JsonResponse
    {
        abort_unless($customer->role === 'customer', 404);
        $data = $request->validated();
        $data['email'] = strtolower(trim($data['email']));
        $customer->update($data);

        return response()->json(['data' => $customer->fresh()]);
    }

    public function orders(Request $request): JsonResponse
    {
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', Rule::in(Order::STATUSES)], 'payment_status' => ['nullable', Rule::in(Order::PAYMENT_STATUSES)], 'per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);
        $orders = Order::query()->with(['items', 'payment', 'user:id,name,email'])
            ->when($data['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('number', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%")
                ->orWhere('customer_email', 'like', "%{$search}%")
                ->orWhere('customer_phone', 'like', "%{$search}%")
                ->orWhere('tracking_number', 'like', "%{$search}%")))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['payment_status'] ?? null, fn ($query, $status) => $query->where('payment_status', $status))
            ->latest()->paginate($request->integer('per_page', 15))->withQueryString();

        return response()->json($orders);
    }

    public function showOrder(Order $order): OrderResource
    {
        return new OrderResource($order->load(['items', 'payment']));
    }

    public function updateOrder(AdminOrderUpdateRequest $request, Order $order, OrderService $service): JsonResponse
    {
        return response()->json(['data' => $service->updateByAdmin($order, $request->validated())]);
    }

    public function products(Request $request)
    {
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', Rule::in(['draft', 'published', 'inactive'])], 'per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);
        $products = Product::query()->with('category')
            ->when($data['search'] ?? null, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest()->paginate($request->integer('per_page', 15))->withQueryString();

        return AdminProductResource::collection($products);
    }

    public function showProduct(Product $product): AdminProductResource
    {
        return new AdminProductResource($product->load('category'));
    }

    public function storeProduct(AdminProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return response()->json(['data' => new AdminProductResource($product->load('category'))], 201);
    }

    public function updateProduct(AdminProductRequest $request, Product $product): JsonResponse
    {
        $product->update($request->validated());

        return response()->json(['data' => new AdminProductResource($product->fresh()->load('category'))]);
    }

    public function destroyProduct(Product $product): JsonResponse
    {
        $product->update(['status' => 'inactive']);

        return response()->json(['message' => 'Sản phẩm đã được ngừng kinh doanh.']);
    }

    public function upload(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate(['images' => ['required', 'array', 'max:8'], 'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120']]);
        $paths = collect($data['images'])->map(fn ($file) => Storage::disk('public')->url($file->store('products', 'public')));
        $product->update(['images' => array_values(array_merge($product->images ?? [], $paths->all()))]);

        return response()->json(['data' => $product->images]);
    }

    public function categories(): JsonResponse
    {
        return response()->json(['data' => AdminCategoryResource::collection(Category::query()->withCount('products')->orderBy('name')->get())]);
    }

    public function showCategory(Category $category): AdminCategoryResource
    {
        return new AdminCategoryResource($category->loadCount('products'));
    }

    public function storeCategory(AdminCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated())->fresh()->loadCount('products');

        return response()->json(['data' => new AdminCategoryResource($category)], 201);
    }

    public function updateCategory(AdminCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return response()->json(['data' => new AdminCategoryResource($category->fresh()->loadCount('products'))]);
    }

    public function destroyCategory(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages(['category' => 'Không thể xóa danh mục đang có sản phẩm.']);
        }
        $category->delete();

        return response()->json(['message' => 'Đã xóa danh mục.']);
    }

    public function coupons(Request $request): JsonResponse
    {
        $request->validate(['per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);

        return response()->json(Coupon::query()->withCount('usages')->latest()->paginate($request->integer('per_page', 15)));
    }

    public function showCoupon(Coupon $coupon): JsonResponse
    {
        return response()->json(['data' => $coupon->loadCount('usages')]);
    }

    public function storeCoupon(AdminCouponRequest $request): JsonResponse
    {
        return response()->json(['data' => Coupon::create($request->validated())], 201);
    }

    public function updateCoupon(AdminCouponRequest $request, Coupon $coupon): JsonResponse
    {
        $coupon->update($request->validated());

        return response()->json(['data' => $coupon->fresh()]);
    }

    public function destroyCoupon(Coupon $coupon): JsonResponse
    {
        if ($coupon->usages()->exists()) {
            $coupon->update(['active' => false]);
        } else {
            $coupon->delete();
        }

        return response()->json(['message' => 'Voucher đã được ngừng sử dụng.']);
    }

    public function banners(): JsonResponse
    {
        return response()->json(['data' => Banner::query()->orderBy('position')->orderByDesc('id')->get()]);
    }

    public function storeBanner(AdminBannerRequest $request): JsonResponse
    {
        return response()->json(['data' => Banner::create($request->validated())], 201);
    }

    public function updateBanner(AdminBannerRequest $request, Banner $banner): JsonResponse
    {
        $banner->update($request->validated());

        return response()->json(['data' => $banner->fresh()]);
    }

    public function contacts(Request $request): JsonResponse
    {
        $request->validate(['per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);

        return response()->json(Contact::query()->latest()->paginate($request->integer('per_page', 15))->withQueryString());
    }

    public function showContact(Contact $contact): JsonResponse
    {
        return response()->json(['data' => $contact]);
    }

    public function policies(): JsonResponse
    {
        return response()->json(['data' => Policy::query()->latest()->get()]);
    }

    public function storePolicy(AdminPolicyRequest $request): JsonResponse
    {
        return response()->json(['data' => Policy::create($request->validated())], 201);
    }

    public function updatePolicy(AdminPolicyRequest $request, Policy $policy): JsonResponse
    {
        $policy->update($request->validated());

        return response()->json(['data' => $policy->fresh()]);
    }
}
