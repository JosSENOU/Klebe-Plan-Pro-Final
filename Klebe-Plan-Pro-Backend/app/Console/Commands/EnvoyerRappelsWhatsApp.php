<?php

namespace App\Console\Commands;

use App\Models\RendezVous;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Commande planifiée (tâche Bilal — "programmer les 3 rappels automatiques").
 *
 * Tourne chaque minute (voir app/Console/Kernel.php) et envoie, pour chaque
 * rendez-vous encore actif :
 *   - le rappel "veille" la veille à 18h00
 *   - le rappel "jour J"  le jour même à 08h00
 *   - le rappel "15 min avant" 15 minutes avant l'heure du rendez-vous
 *
 * Gère aussi le quota (comptage + blocage) : avant d'envoyer, on vérifie
 * Entreprise::quotaAtteint(). Si le quota est dépassé, l'envoi est bloqué
 * (et retenté à la prochaine exécution, au cas où le quota serait
 * réinitialisé ou un pack acheté entre-temps).
 */
class EnvoyerRappelsWhatsApp extends Command
{
    protected $signature = 'rappels:envoyer';

    protected $description = 'Envoie les rappels WhatsApp (veille 18h, jour J 8h, 15 min avant) dus à la minute en cours.';

    public function handle(WhatsAppService $whatsapp): int
    {
        $maintenant = Carbon::now();

        $rendezVous = RendezVous::query()
            ->whereNotIn('statut', ['annule', 'termine', 'manque'])
            ->whereDate('date', '>=', $maintenant->copy()->subDay()->toDateString())
            ->whereDate('date', '<=', $maintenant->copy()->addDay()->toDateString())
            ->with('entreprise')
            ->get();

        $envoyes = 0;
        $bloquesQuota = 0;
        $echecs = 0;

        foreach ($rendezVous as $rdv) {
            foreach ($this->rappelsDus($rdv, $maintenant) as [$type, $colonne, $message]) {
                try {
                    $resultat = $this->traiterRappel($whatsapp, $rdv, $type, $colonne, $message);

                    if ($resultat === 'envoye') {
                        $envoyes++;
                    } elseif ($resultat === 'quota_atteint') {
                        $bloquesQuota++;
                    }
                } catch (Throwable $e) {
                    // On log et on continue : un échec d'envoi ne doit jamais
                    // bloquer les rappels des autres rendez-vous.
                    $echecs++;
                    Log::error("Échec du rappel [{$type}] pour le RDV #{$rdv->id}", [
                        'erreur' => $e->getMessage(),
                    ]);
                }
            }
        }

        $this->info("Rappels envoyés : {$envoyes} | bloqués (quota) : {$bloquesQuota} | échecs : {$echecs}");

        return self::SUCCESS;
    }

    /**
     * Détermine quels rappels sont dus PILE à la minute en cours pour ce RDV,
     * et qui n'ont pas déjà été envoyés (colonne *_envoye_a encore nulle).
     *
     * @return array<int, array{0: string, 1: string, 2: string}> [type, colonne, message]
     */
    private function rappelsDus(RendezVous $rdv, Carbon $maintenant): array
    {
        $dus = [];
        $dateHeureRdv = Carbon::parse($rdv->date->toDateString().' '.$rdv->heure);

        $veilleA18h = $dateHeureRdv->copy()->subDay()->setTime(18, 0);
        if ($rdv->rappel_veille_envoye_a === null && $this->estDansLaMinute($maintenant, $veilleA18h)) {
            $dus[] = ['veille', 'rappel_veille_envoye_a', $rdv->entreprise->rendreMessage('veille', $rdv)];
        }

        $jourJA8h = $dateHeureRdv->copy()->setTime(8, 0);
        if ($rdv->rappel_jour_j_envoye_a === null && $this->estDansLaMinute($maintenant, $jourJA8h)) {
            $dus[] = ['jour_j', 'rappel_jour_j_envoye_a', $rdv->entreprise->rendreMessage('jour_j', $rdv)];
        }

        $quinzeMinAvant = $dateHeureRdv->copy()->subMinutes(15);
        if ($rdv->rappel_15min_envoye_a === null && $this->estDansLaMinute($maintenant, $quinzeMinAvant)) {
            $dus[] = ['15min', 'rappel_15min_envoye_a', $rdv->entreprise->rendreMessage('15min', $rdv)];
        }

        return $dus;
    }

    /**
     * Compare à la minute près (pas à la seconde) pour ne pas rater le
     * créneau si la commande met quelques secondes à s'exécuter.
     */
    private function estDansLaMinute(Carbon $maintenant, Carbon $cible): bool
    {
        return $maintenant->format('Y-m-d H:i') === $cible->format('Y-m-d H:i');
    }

    /**
     * Envoie un rappel unique en respectant le quota (comptage + blocage —
     * "tâche Bilal, système de quota").
     *
     * @return string 'envoye' | 'quota_atteint'
     */
    private function traiterRappel(WhatsAppService $whatsapp, RendezVous $rdv, string $type, string $colonne, string $message): string
    {
        $entreprise = $rdv->entreprise;

        if ($entreprise->quotaAtteint()) {
            Log::warning("Rappel [{$type}] bloqué : quota WhatsApp atteint pour l'entreprise #{$entreprise->id}", [
                'rdv_id' => $rdv->id,
            ]);

            return 'quota_atteint';
        }

        $whatsapp->envoyerMessage($entreprise->telephone_dg, $message);

        $rdv->forceFill([$colonne => now()])->save();

        $entreprise->increment('quota_utilise');

        return 'envoye';
    }
}
