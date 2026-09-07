<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Notifications dérivées des rendez-vous proches (aujourd'hui / demain) —
 * pas de table dédiée : calculées à la volée à partir de rendez_vous.
 * Consommé par la cloche (toutes les pages) et par la page Messages.
 */
class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $aujourdhui = Carbon::today();
        $demain = $aujourdhui->copy()->addDay();

        $rendezVous = RendezVous::query()
            ->where('entreprise_id', $request->user()->entreprise_id)
            ->whereNotIn('statut', ['annule', 'termine', 'manque'])
            ->whereDate('date', '>=', $aujourdhui)
            ->whereDate('date', '<=', $demain)
            ->orderBy('date')
            ->orderBy('heure')
            ->get();

        $notifications = $rendezVous->map(function (RendezVous $rdv) use ($aujourdhui) {
            $estAujourdhui = $rdv->date->isSameDay($aujourdhui);
            $heure = Carbon::parse($rdv->heure)->format('H:i');

            return [
                'id' => 'rdv-'.$rdv->id,
                'rendez_vous_id' => $rdv->id,
                'niveau' => $estAujourdhui ? 'urgent' : 'info',
                'titre' => $estAujourdhui ? "Aujourd'hui : {$rdv->nom}" : "Demain : {$rdv->nom}",
                'message' => $estAujourdhui
                    ? "Rendez-vous \"{$rdv->nom}\" aujourd'hui à {$heure}."
                    : "Rendez-vous \"{$rdv->nom}\" demain à {$heure}.",
                'rappel_jour_j_envoye' => $rdv->rappel_jour_j_envoye_a !== null,
                'rappel_15min_envoye' => $rdv->rappel_15min_envoye_a !== null,
            ];
        });

        return response()->json(['data' => $notifications->values()]);
    }
}
