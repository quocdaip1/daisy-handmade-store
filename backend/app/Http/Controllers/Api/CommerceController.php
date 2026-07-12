<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Contact;
use App\Models\Policy;
use App\Models\ShippingMethod;
use Illuminate\Http\Request;

class CommerceController extends Controller
{
    public function shipping(Request $r)
    {
        $data = $r->validate(['subtotal' => ['required', 'integer', 'min:0']]);

        return response()->json(['data' => ShippingMethod::where('active', true)->get()->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'code' => $m->code, 'fee' => $m->quote($data['subtotal'])])]);
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
}
