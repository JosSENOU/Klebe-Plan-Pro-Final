<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Pour tester rapidement l'API sans passer par un vrai formulaire d'inscription
 * (l'inscription elle-même n'est pas dans le périmètre de Pinel, voir README).
 */
class EntrepriseFactory extends Factory
{
    public function definition(): array
    {
        $plan = $this->faker->randomElement(['essentiel', 'business']);

        return [
            'nom' => $this->faker->company(),
            'telephone_dg' => '+229' . $this->faker->numerify('6########'),
            'nom_dg' => $this->faker->name(),
            'plan' => $plan,
            'plan_actif_jusqu_au' => now()->addMonth(),
            'quota_mensuel' => $plan === 'business' ? 2500 : 500,
            'quota_utilise' => 0,
            'quota_packs_supplementaires' => 0,
            'quota_reinitialise_le' => now()->startOfMonth()->addMonth(),
            'actif' => true,
        ];
    }
}
