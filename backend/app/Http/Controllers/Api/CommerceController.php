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
        return response()->json(['data' => StoreSetting::current()->publicContactPopup()]);
    }

    public function siteSettings()
    {
        $settings = StoreSetting::current();
        $socialLinks = $settings->socialLinks();
        $socialLinks['contact_popup'] = $settings->publicContactPopup();

        return response()->json(['data' => [
            'shop_information' => $settings->shopInformation(),
            'social_links' => $socialLinks,
            'seo_defaults' => $settings->seoDefaults(),
        ]])->header('Cache-Control', 'no-store');
    }
}
