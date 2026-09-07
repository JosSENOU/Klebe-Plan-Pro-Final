<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lecture + gestion du quota/forfait — consommé par l'écran "quota" du front.
 * L'écriture du quota_utilise se fait ailleurs (à chaque envoi WhatsApp) ;
 * ici on expose la lecture, le changement de forfait et la recharge de packs.
 */
class QuotaController extends Controller
{
    /**
     * GET /api/quota
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->format($request->user()->entreprise)]);
    }

    /**
     * PATCH /api/quota/plan
     * Change de forfait (essentiel <-> business) ; ajuste le quota mensuel inclus.
     */
    public function changerPlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => ['required', 'in:'.implode(',', array_keys(Entreprise::QUOTA_PAR_PLAN))],
        ]);

        $entreprise = $request->user()->entreprise;
        $entreprise->changerPlan($validated['plan']);

        return response()->json([
            'message' => 'Forfait mis à jour.',
            'data' => $this->format($entreprise->fresh()),
        ]);
    }

    /**
     * POST /api/quota/recharge
     * Crédite un ou plusieurs packs de 100 messages (pas de paiement réel
     * intégré ici — hors scope V1.3, juste le crédit du quota).
     */
    public function recharger(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'packs' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $entreprise = $request->user()->entreprise;
        $entreprise->ajouterPacks($validated['packs']);

        return response()->json([
            'message' => 'Quota rechargé.',
            'data' => $this->format($entreprise->fresh()),
        ]);
    }

    private function format(Entreprise $entreprise): array
    {
        return [
            'plan' => $entreprise->plan,
            'quota_mensuel' => $entreprise->quota_mensuel,
            'quota_utilise' => $entreprise->quota_utilise,
            'quota_packs_supplementaires' => $entreprise->quota_packs_supplementaires,
            'quota_restant' => $entreprise->quotaRestant(),
            'quota_atteint' => $entreprise->quotaAtteint(),
            'reinitialise_le' => $entreprise->quota_reinitialise_le?->toIso8601String(),
        ];
    }
}
