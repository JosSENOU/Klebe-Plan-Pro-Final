<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddTeamMemberRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Gestion des permissions d'équipe — tâche "Pinel".
 * Consommé par l'écran "Connexion, équipe, quota" de Keira (front).
 * Seul un utilisateur "proprietaire" peut ajouter/retirer une assistante.
 */
class TeamController extends Controller
{
    /**
     * GET /api/equipe
     * Liste des membres (assistantes + propriétaire) de l'entreprise connectée.
     */
    public function index(Request $request): JsonResponse
    {
        $membres = User::query()
            ->where('entreprise_id', $request->user()->entreprise_id)
            ->orderBy('role', 'desc') // proprietaire en premier
            ->orderBy('nom')
            ->get(['id', 'nom', 'email', 'telephone', 'role', 'actif']);

        return response()->json(['data' => $membres]);
    }

    /**
     * POST /api/equipe
     * Ajoute une nouvelle assistante à l'entreprise connectée.
     */
    public function store(AddTeamMemberRequest $request): JsonResponse
    {
        $membre = User::create([
            ...$request->validated(),
            'password' => Hash::make($request->validated('password')),
            'entreprise_id' => $request->user()->entreprise_id,
            'role' => 'assistante',
        ]);

        return response()->json([
            'message' => 'Assistante ajoutée à l\'équipe.',
            'data' => $membre->only(['id', 'nom', 'email', 'telephone', 'role', 'actif']),
        ], 201);
    }

    /**
     * PATCH /api/equipe/{membre}/desactiver
     * Retire l'accès d'une assistante sans supprimer son historique de RDV créés.
     */
    public function desactiver(Request $request, User $membre): JsonResponse
    {
        $this->autoriserGestionEquipe($request, $membre);

        $membre->update(['actif' => false]);

        return response()->json(['message' => 'Membre désactivé.']);
    }

    /**
     * PATCH /api/equipe/{membre}/reactiver
     */
    public function reactiver(Request $request, User $membre): JsonResponse
    {
        $this->autoriserGestionEquipe($request, $membre);

        $membre->update(['actif' => true]);

        return response()->json(['message' => 'Membre réactivé.']);
    }

    /**
     * DELETE /api/equipe/{membre}
     * Suppression définitive (ex: erreur de saisie). Les RDV déjà créés
     * par ce membre sont conservés (cree_par_id référence toujours l'historique).
     */
    public function destroy(Request $request, User $membre): JsonResponse
    {
        $this->autoriserGestionEquipe($request, $membre);

        if ($membre->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas vous retirer vous-même.'], 422);
        }

        $membre->delete();

        return response()->json(['message' => 'Membre retiré de l\'équipe.']);
    }

    private function autoriserGestionEquipe(Request $request, User $membre): void
    {
        abort_unless($request->user()->estProprietaire(), 403, 'Seul le propriétaire peut gérer l\'équipe.');
        abort_unless($membre->entreprise_id === $request->user()->entreprise_id, 403);
    }
}
