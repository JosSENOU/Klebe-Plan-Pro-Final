<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Jeu de données de démo pour que Josephine/Shalom/Keira puissent brancher
 * le front sur des données réalistes sans attendre l'inscription (tâche Bilal).
 * Lancer avec : php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $entreprise = Entreprise::factory()->create([
            'nom' => 'Cabinet Démo SARL',
            'plan' => 'business',
        ]);

        $proprietaire = User::factory()->proprietaire()->create([
            'entreprise_id' => $entreprise->id,
            'nom' => 'Josephine (Démo Propriétaire)',
            'email' => 'proprietaire@demo.klebeplan.test',
        ]);

        $assistante = User::factory()->create([
            'entreprise_id' => $entreprise->id,
            'nom' => 'Assistante Démo',
            'email' => 'assistante@demo.klebeplan.test',
        ]);

        RendezVous::factory()
            ->count(8)
            ->state(fn () => [
                'entreprise_id' => $entreprise->id,
                'cree_par_id' => $assistante->id,
            ])
            ->create();

        $this->command?->info('Démo créée. Connexion : proprietaire@demo.klebeplan.test / password');
    }
}
