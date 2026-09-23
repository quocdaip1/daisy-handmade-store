<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankQrCode;
use App\Models\Banner;
use App\Models\Contact;
use App\Models\Policy;
use App\Models\StoreSetting;
use Illuminate\Http\Request;

class CommerceController extends Controller
{
    public function bankQr()
    {
        $qrCode = BankQrCode::current();
        abort_unless($qrCode, 404);

        return response($qrCode->image_data, 200, [
            'Content-Type' => $qrCode->mime_type,
            'Content-Disposition' => 'inline; filename="bank-transfer-qr"',
            'Cache-Control' => 'public, max-age=300',
            'ETag' => '"'.sha1($qrCode->image_data).'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function contact(Request $r)
    {
        $contact = Contact::create($r->validate(['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255'], 'phone' => ['nullable', 'string', 'max:20'], 'subject' => ['required', 'string', 'max:255'], 'message' => ['required', 'string', 'max:3000']]));

        return response()->json(['message' => 'Đã nhận liên hệ.', 'data' => ['id' => $contact->id]], 201);
    }

    public function policies()
    {
        return response()->json(['data' => Policy::where('published', true)->get()]);
    }

    public function policy(Policy $policy)
    {
        abort_unless($policy->published, 404);

        return response()->json(['data' => $policy]);
    }

    public function banners()
    {
        return response()->json(['data' => Banner::where('active', true)->orderBy('position')->get()]);
    }

    public function contactPopup()
    {
        $contactPopup = StoreSetting::current()->contactPopup();
        $zaloPhone = preg_replace('/\D+/', '', (string) $contactPopup['zalo']['phone']);
        $zaloLink = trim((string) $contactPopup['zalo']['link']);

        if ($zaloLink === '' && $zaloPhone !== '') {
            $zaloLink = 'https://zalo.me/'.$zaloPhone;
        }

        return response()->json(['data' => [
            'facebook' => [
                'display_name' => $contactPopup['facebook']['display_name'],
                'link' => $contactPopup['facebook']['link'],
                'enabled' => (bool) $contactPopup['facebook']['enabled'],
            ],
            'zalo' => [
                'display_name' => $contactPopup['zalo']['display_name'],
                'phone' => $contactPopup['zalo']['phone'],
                'link' => $zaloLink,
                'enabled' => (bool) $contactPopup['zalo']['enabled'],
            ],
        ]]);
    }
}
