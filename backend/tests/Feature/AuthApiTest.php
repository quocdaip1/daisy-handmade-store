<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Daisy Customer',
            'email' => 'customer@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'customer@example.com')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'customer@example.com']);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_user_can_login_and_access_me_endpoint(): void
    {
        User::factory()->create([
            'email' => 'customer@example.com',
            'password' => 'secret123',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'customer@example.com',
            'password' => 'secret123',
        ])->assertOk();

        $this->withToken($login->json('token'))
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'customer@example.com');
    }

    public function test_profile_response_keeps_existing_contract(): void
    {
        $user = User::factory()->create(['name' => 'Daisy Customer']);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertExactJson(['user' => [
                'id' => $user->id,
                'name' => 'Daisy Customer',
                'email' => $user->email,
            ]]);
    }

    public function test_logout_revokes_only_the_current_token(): void
    {
        $user = User::factory()->create();
        $currentToken = $user->createToken('web')->plainTextToken;
        $otherToken = $user->createToken('other-device')->plainTextToken;

        $this->withToken($currentToken)->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Đăng xuất thành công.');

        $this->assertNull(PersonalAccessToken::findToken($currentToken));
        $this->assertNotNull(PersonalAccessToken::findToken($otherToken));
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->create(['email' => 'customer@example.com']);

        $this->postJson('/api/login', [
            'email' => 'customer@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_auth_validation_normalizes_email_and_rejects_invalid_payloads(): void
    {
        $this->postJson('/api/register', [
            'name' => ' D ',
            'email' => ' INVALID ',
            'password' => '123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);

        $this->postJson('/api/register', [
            'name' => ' Daisy Customer ',
            'email' => ' CUSTOMER@EXAMPLE.COM ',
            'password' => 'secret123',
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'name' => 'Daisy Customer',
            'email' => 'customer@example.com',
        ]);
    }
}
