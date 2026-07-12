<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product)],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product)],
            'description' => ['required', 'string', 'max:10000'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'integer', 'min:0'],
            'original_price' => ['nullable', 'integer', 'min:0', 'gte:price'],
            'material' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'max:255'],
            'stock' => ['required', 'integer', 'min:0'],
            'images' => ['sometimes', 'array', 'max:8'],
            'images.*' => ['string', 'max:2048'],
            'featured' => ['sometimes', 'boolean'],
            'is_new' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'inactive'])],
            'rating' => ['sometimes', 'numeric', 'between:0,5'],
        ];
    }
}
