<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lecture/écriture des 3 modèles de messages WhatsApp (veille/jour J/15min)
 * personnalisables par entreprise. Consommé par la page "Messages" du front.
 */
class MessageController extends Controller
{
    /**
     * GET /api/messages
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->format($request->user()->entreprise)]);
    }

    /**
     * PUT /api/messages
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message_veille' => ['nullable', 'string', 'max:500'],
            'message_jour_j' => ['nullable', 'string', 'max:500'],
            'message_15min' => ['nullable', 'string', 'max:500'],
        ]);

        $entreprise = $request->user()->entreprise;
        $entreprise->update($validated);

        return response()->json([
            'message' => 'Messages mis à jour.',
            'data' => $this->format($entreprise->fresh()),
        ]);
    }

    private function format(Entreprise $entreprise): array
    {
        return [
            'veille' => [
                'template' => $entreprise->messageTemplate('veille'),
                'personnalise' => $entreprise->message_veille !== null,
            ],
            'jour_j' => [
                'template' => $entreprise->messageTemplate('jour_j'),
                'personnalise' => $entreprise->message_jour_j !== null,
            ],
            '15min' => [
                'template' => $entreprise->messageTemplate('15min'),
                'personnalise' => $entreprise->message_15min !== null,
            ],
        ];
    }
}
