<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductIndexRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(ProductIndexRequest $request): AnonymousResourceCollection
    {
        $query = $this->filteredQuery($request);

        if ($request->hasAny(['page', 'per_page'])) {
            return ProductResource::collection($query->paginate($request->integer('per_page', 15))->withQueryString());
        }

        return ProductResource::collection($query->get());
    }

    public function show(string $slug): ProductResource
    {
        return new ProductResource(Product::query()
            ->published()
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail());
    }

    public function related(ProductIndexRequest $request, string $slug): AnonymousResourceCollection
    {
        $product = Product::query()->published()->where('slug', $slug)->firstOrFail();
        $products = Product::query()
            ->published()
            ->with('category')
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->getKey())
            ->orderByDesc('featured')
            ->orderByDesc('rating')
            ->limit($request->integer('limit', 4))
            ->get();

        return ProductResource::collection($products);
    }

    public function newArrivals(ProductIndexRequest $request): AnonymousResourceCollection
    {
        return ProductResource::collection(Product::query()
            ->published()
            ->with('category')
            ->where('is_new', true)
            ->latest()
            ->paginate($request->integer('per_page', 12))
            ->withQueryString());
    }

    public function bestSellers(ProductIndexRequest $request): AnonymousResourceCollection
    {
        return ProductResource::collection(Product::query()
            ->published()
            ->with('category')
            ->where('featured', true)
            ->orderByDesc('rating')
            ->latest()
            ->paginate($request->integer('per_page', 12))
            ->withQueryString());
    }

    private function filteredQuery(ProductIndexRequest $request): Builder
    {
        return Product::query()
            ->published()
            ->with('category')
            ->search($request->validated('search'))
            ->inCategory($request->integer('category') ?: null)
            ->inPriceRange(
                $request->filled('min_price') ? $request->integer('min_price') : null,
                $request->filled('max_price') ? $request->integer('max_price') : null,
            )
            ->when($request->filled('featured'), fn ($query) => $query->where('featured', $request->boolean('featured')))
            ->when($request->filled('is_new'), fn ($query) => $query->where('is_new', $request->boolean('is_new')))
            ->sorted($request->validated('sort') ?? 'featured');
    }
}
