<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    private function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'phone' => ['required', 'string', 'max:20'], 'city' => ['required', 'string', 'max:100'], 'district' => ['required', 'string', 'max:100'], 'address' => ['required', 'string', 'max:500'], 'is_default' => ['sometimes', 'boolean']];
    }

    public function index(Request $r)
    {
        return response()->json(['data' => $r->user()->addresses()->latest()->get()]);
    }

    public function store(Request $r)
    {
        $data = $r->validate($this->rules());
        if ($data['is_default'] ?? false) {
            $r->user()->addresses()->update(['is_default' => false]);
        }$address = $r->user()->addresses()->create($data);

        return response()->json(['data' => $address], 201);
    }

    public function update(Request $r, Address $address)
    {
        abort_unless($address->user_id === $r->user()->id, 403);
        $data = $r->validate($this->rules());
        if ($data['is_default'] ?? false) {
            $r->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
        }$address->update($data);

        return response()->json(['data' => $address]);
    }

    public function destroy(Request $r, Address $address)
    {
        abort_unless($address->user_id === $r->user()->id, 403);
        $address->delete();

        return response()->noContent();
    }
}
