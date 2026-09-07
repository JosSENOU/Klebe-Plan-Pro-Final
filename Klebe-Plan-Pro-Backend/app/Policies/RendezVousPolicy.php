<?php

namespace App\Policies;

use App\Models\RendezVous;
use App\Models\User;

/**
 * Règle de permission centrale du projet :
 * une assistante ne voit / modifie QUE les rendez-vous de SA propre entreprise.
 * Sans ça, n'importe quelle entreprise cliente pourrait voir les RDV d'une autre.
 */
class RendezVousPolicy
{
    public function view(User $user, RendezVous $rendezVous): bool
    {
        return $user->entreprise_id === $rendezVous->entreprise_id;
    }

    public function update(User $user, RendezVous $rendezVous): bool
    {
        return $user->entreprise_id === $rendezVous->entreprise_id && $user->actif;
    }

    public function delete(User $user, RendezVous $rendezVous): bool
    {
        return $user->entreprise_id === $rendezVous->entreprise_id && $user->actif;
    }
}
