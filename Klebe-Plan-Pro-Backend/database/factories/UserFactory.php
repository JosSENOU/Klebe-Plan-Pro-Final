<?php

namespace Database\Factories;

use App\Models\Entreprise;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'entreprise_id' => Entreprise::factory(),
            'nom' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'telephone' => '+229' . $this->faker->numerify('6########'),
            'role' => 'assistante',
            'actif' => true,
            'remember_token' => Str::random(10),
            'email_verified_at' => now(),
        ];
    }

    public function proprietaire(): static
    {
        return $this->state(fn () => ['role' => 'proprietaire']);
    }

    public function inactif(): static
    {
        return $this->state(fn () => ['actif' => false]);
    }
}
