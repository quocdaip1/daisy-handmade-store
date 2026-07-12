<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'integer', 'exists:categories,id'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'featured' => ['nullable', 'boolean'],
            'is_new' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['featured', 'price_asc', 'price_desc', 'newest', 'rating_desc', 'name_asc'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->filled('min_price') && $this->filled('max_price')
                    && $this->integer('max_price') < $this->integer('min_price')) {
                    $validator->errors()->add('max_price', 'The max price field must be greater than or equal to min price.');
                }
            },
        ];
    }
}
