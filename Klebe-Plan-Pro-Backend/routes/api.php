<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\QuotaController;
use App\Http\Controllers\Api\RendezVousController;
use App\Http\Controllers\Api\TeamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes API — Pinel (RDV/équipe/quota) + Bilal (authentification)
|--------------------------------------------------------------------------
| À COLLER dans le routes/api.php du projet Laravel principal.
*/

// --- Authentification (tâche Bilal, publique) ---
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // --- Session (tâche Bilal) ---
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);


    // --- Rendez-vous (CRUD complet) ---
    // Le nom du paramètre est forcé explicitement : Laravel singularise mal
    // "rendez-vous" (mot français) en "rendez_vou", ce qui cassait le
    // model-binding implicite (show/update/destroy recevaient un modèle vide).
    Route::apiResource('rendez-vous', RendezVousController::class)
        ->parameters(['rendez-vous' => 'rendezVous']);

    // --- Équipe / permissions ---
    Route::get('equipe', [TeamController::class, 'index']);
    Route::post('equipe', [TeamController::class, 'store']);
    Route::patch('equipe/{membre}/desactiver', [TeamController::class, 'desactiver']);
    Route::patch('equipe/{membre}/reactiver', [TeamController::class, 'reactiver']);
    Route::delete('equipe/{membre}', [TeamController::class, 'destroy']);

    // --- Quota (lecture + gestion forfait/recharge) ---
    Route::get('quota', [QuotaController::class, 'show']);
    Route::patch('quota/plan', [QuotaController::class, 'changerPlan']);
    Route::post('quota/recharge', [QuotaController::class, 'recharger']);

    // --- Messages WhatsApp (lecture/écriture des 3 modèles de rappel) ---
    Route::get('messages', [MessageController::class, 'show']);
    Route::put('messages', [MessageController::class, 'update']);

    // --- Notifications (RDV proches, dérivées à la volée) ---
    Route::get('notifications', [NotificationController::class, 'index']);
});
