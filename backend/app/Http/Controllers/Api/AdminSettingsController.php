<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminSettingsRequest;
use App\Models\ShippingMethod;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class AdminSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return $this->response(StoreSetting::current());
    }

    public function update(AdminSettingsRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            StoreSetting::current()->update(Arr::only($data, [
                'shop_information', 'bank_account', 'social_links', 'seo_defaults',
            ]));

            $codes = collect($data['shipping_methods'])->pluck('code');
            ShippingMethod::query()->when(
                $codes->isNotEmpty(),
                fn ($query) => $query->whereNotIn('code', $codes),
            )->update(['active' => false]);

            foreach ($data['shipping_methods'] as $method) {
                ShippingMethod::query()->updateOrCreate(
                    ['code' => $method['code']],
                    Arr::except($method, 'code'),
                );
            }
        });

        return $this->response(StoreSetting::current()->fresh());
    }

    private function response(StoreSetting $settings): JsonResponse
    {
        return response()->json(['data' => [
            'shop_information' => $settings->shop_information,
            'bank_account' => $settings->bank_account,
            'shipping_methods' => ShippingMethod::query()->orderBy('name')->get(),
            'social_links' => $settings->social_links,
            'seo_defaults' => $settings->seo_defaults,
        ]]);
    }
}
