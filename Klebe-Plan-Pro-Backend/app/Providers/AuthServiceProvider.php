<?php

namespace App\Providers;

use App\Models\RendezVous;
use App\Policies\RendezVousPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

/**
 * ⚠️ NE PAS COPIER TEL QUEL si le projet principal a déjà un AuthServiceProvider :
 * fusionner uniquement le tableau $policies ci-dessous dans le fichier existant.
 */
class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        RendezVous::class => RendezVousPolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}
