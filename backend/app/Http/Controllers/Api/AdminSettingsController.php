<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminBankQrRequest;
use App\Http\Requests\AdminContactPopupSettingsRequest;
use App\Http\Requests\AdminSettingsRequest;
use App\Models\BankQrCode;
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
            $settings = StoreSetting::current();
            $contactPopup = $settings->contactPopup();
            $socialLinks = $data['social_links'];
            $socialLinks['contact_popup'] = $contactPopup;

            $settings->update([
                ...Arr::only($data, ['shop_information', 'bank_account', 'seo_defaults']),
                'social_links' => $socialLinks,
            ]);

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

    public function showContactPopup(): JsonResponse
    {
        return response()->json(['data' => StoreSetting::current()->contactPopup()]);
    }

    public function updateContactPopup(AdminContactPopupSettingsRequest $request): JsonResponse
    {
        $settings = StoreSetting::current();
        $settings->updateContactPopup($request->validated());

        return response()->json([
            'message' => 'Đã cập nhật thông tin liên hệ.',
            'data' => $settings->fresh()->contactPopup(),
        ]);
    }

    public function uploadBankQr(AdminBankQrRequest $request): JsonResponse
    {
        $image = $request->file('qr_image');

        BankQrCode::query()->updateOrCreate(['id' => 1], [
            'file_name' => $image->getClientOriginalName(),
            'mime_type' => $image->getMimeType() ?: 'image/png',
            'image_data' => $image->get(),
        ]);

        return $this->response(StoreSetting::current());
    }

    public function deleteBankQr(): JsonResponse
    {
        BankQrCode::query()->delete();

        return $this->response(StoreSetting::current());
    }

    private function response(StoreSetting $settings): JsonResponse
    {
        return response()->json(['data' => [
            'shop_information' => $settings->shop_information,
            'bank_account' => array_merge($settings->bank_account, [
                'qr_image_url' => BankQrCode::publicUrl(),
            ]),
            'shipping_methods' => ShippingMethod::query()->orderBy('name')->get(),
            'social_links' => $settings->social_links,
            'seo_defaults' => $settings->seo_defaults,
        ]]);
    }
}
