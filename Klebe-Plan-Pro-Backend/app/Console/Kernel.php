<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

/**
 * Tâche Bilal — "programmer les 3 rappels automatiques".
 * À FUSIONNER dans app/Console/Kernel.php du projet principal si un
 * Kernel existe déjà : ne garder que la méthode schedule() ci-dessous
 * et copier la ligne rappels:envoyer dedans.
 */
class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Tourne chaque minute pour ne rater aucun créneau de rappel
        // (veille 18h, jour J 8h, 15 min avant) : la commande elle-même
        // filtre ce qui est réellement dû à la minute en cours.
        $schedule->command('rappels:envoyer')
            ->everyMinute()
            ->withoutOverlapping()
            ->runInBackground();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
