<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Entreprise;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Authentification (tâche Bilal). Gère :
 * - l'inscription du tout premier compte "proprietaire", qui crée son
 *   entreprise en même temps (volontairement laissé hors du périmètre de
 *   Pinel pour éviter un conflit de code, voir README)
 * - la connexion / déconnexion via Laravel Sanctum (tokens API)
 */
class AuthController extends Controller
{
    /**
     * POST /api/register
     * Public. Crée l'entreprise ET le compte "proprietaire" en une transaction.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $valide = $request->validated();

        $utilisateur = DB::transaction(function () use ($valide) {
            $entreprise = Entreprise::create([
                'nom' => $valide['entreprise_nom'],
                'telephone_dg' => $valide['telephone_dg'],
                'nom_dg' => $valide['nom_dg'] ?? null,
                'plan' => 'essentiel',
                'quota_mensuel' => 500,
                'quota_reinitialise_le' => now()->addMonth(),
            ]);

            return User::create([
                'entreprise_id' => $entreprise->id,
                'nom' => $valide['nom'],
                'email' => $valide['email'],
                'password' => Hash::make($valide['password']),
                'telephone' => $valide['telephone'] ?? null,
                'role' => 'proprietaire',
            ]);
        });

        $token = $utilisateur->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $utilisateur->load('entreprise'),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * POST /api/login
     * Public.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $valide = $request->validated();

        $utilisateur = User::where('email', $valide['email'])->first();

        if (! $utilisateur || ! Hash::check($valide['password'], $utilisateur->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if (! $utilisateur->actif) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte a été désactivé. Contactez le propriétaire.'],
            ]);
        }

        $token = $utilisateur->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $utilisateur->load('entreprise'),
                'token' => $token,
            ],
        ]);
    }

    /**
     * POST /api/logout
     * Révoque uniquement le token utilisé pour cette requête (pas les autres
     * appareils connectés).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /**
     * GET /api/me
     * Pratique pour le front : récupérer l'utilisateur + son entreprise
     * à partir du token, sans avoir à le redécoder côté client.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->load('entreprise'),
        ]);
    }
}
