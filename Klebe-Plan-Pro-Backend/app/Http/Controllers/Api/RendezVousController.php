<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRendezVousRequest;
use App\Http\Requests\UpdateRendezVousRequest;
use App\Http\Resources\RendezVousResource;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoints CRUD rendez-vous — tâche "Pinel — Données & API RDV".
 * Toutes les routes sont scopées à l'entreprise de l'utilisateur connecté :
 * une assistante ne peut jamais lister/modifier les RDV d'une autre entreprise.
 */
class RendezVousController extends Controller
{
    /**
     * GET /api/rendez-vous
     * Liste des RDV de l'entreprise connectée, pour le dashboard (tâche Josephine).
     * Filtres optionnels : ?statut=confirme&date=2026-08-31
     */
    public function index(Request $request): JsonResponse
    {
        $query = RendezVous::query()
            ->where('entreprise_id', $request->user()->entreprise_id)
            ->with('creePar')
            ->orderBy('date')
            ->orderBy('heure');

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date('date'));
        }

        $rendezVous = $query->paginate($request->integer('par_page', 20));

        return response()->json([
            'data' => RendezVousResource::collection($rendezVous),
            'meta' => [
                'total' => $rendezVous->total(),
                'page' => $rendezVous->currentPage(),
                'dernier_page' => $rendezVous->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/rendez-vous/{rendezVous}
     */
    public function show(Request $request, RendezVous $rendezVous): JsonResponse
    {
        $this->authorize('view', $rendezVous);

        return response()->json(['data' => new RendezVousResource($rendezVous->load('creePar'))]);
    }

    /**
     * POST /api/rendez-vous
     * Créé par une assistante depuis le formulaire (tâche Shalom, front).
     */
    public function store(StoreRendezVousRequest $request): JsonResponse
    {
        $user = $request->user();

        $rendezVous = RendezVous::create([
            ...$request->validated(),
            'entreprise_id' => $user->entreprise_id,
            'cree_par_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Rendez-vous créé avec succès.',
            'data' => new RendezVousResource($rendezVous->load('creePar')),
        ], 201);
    }

    /**
     * PUT/PATCH /api/rendez-vous/{rendezVous}
     */
    public function update(UpdateRendezVousRequest $request, RendezVous $rendezVous): JsonResponse
    {
        $this->authorize('update', $rendezVous);

        $rendezVous->update($request->validated());

        return response()->json([
            'message' => 'Rendez-vous mis à jour.',
            'data' => new RendezVousResource($rendezVous->fresh('creePar')),
        ]);
    }

    /**
     * DELETE /api/rendez-vous/{rendezVous}
     * Suppression douce (soft delete) : le RDV disparaît du dashboard
     * mais reste en base pour l'historique.
     */
    public function destroy(Request $request, RendezVous $rendezVous): JsonResponse
    {
        $this->authorize('delete', $rendezVous);

        $rendezVous->delete();

        return response()->json(['message' => 'Rendez-vous supprimé.']);
    }
}
