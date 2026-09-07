<?php

namespace Database\Factories;

use App\Models\Entreprise;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RendezVousFactory extends Factory
{
    public function definition(): array
    {
        return [
            'entreprise_id' => Entreprise::factory(),
            'cree_par_id' => User::factory(),
            'nom' => 'RDV avec ' . $this->faker->company(),
            'date' => $this->faker->dateTimeBetween('now', '+2 weeks')->format('Y-m-d'),
            'heure' => $this->faker->time('H:i'),
            'lieu' => $this->faker->address(),
            'statut' => 'planifie',
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    public function statut(string $statut): static
    {
        return $this->state(fn () => ['statut' => $statut]);
    }
}
