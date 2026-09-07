<?php

namespace Tests\Feature;

use App\Models\Entreprise;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de la tâche "Pinel — Données & API RDV" : CRUD + isolation multi-tenant.
 * Lancer : php artisan test --filter=RendezVousApiTest
 */
class RendezVousApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_une_assistante_peut_creer_un_rendez_vous(): void
    {
        $user = User::factory()->create();

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/rendez-vous', [
            'nom' => 'Point budget',
            'date' => now()->addDay()->format('Y-m-d'),
            'heure' => '09:30',
            'lieu' => 'Siège',
        ]);

        $reponse->assertCreated()
            ->assertJsonPath('data.nom', 'Point budget')
            ->assertJsonPath('data.statut', 'planifie');

        $this->assertDatabaseHas('rendez_vous', [
            'nom' => 'Point budget',
            'entreprise_id' => $user->entreprise_id,
            'cree_par_id' => $user->id,
        ]);
    }

    public function test_une_assistante_ne_voit_pas_les_rdv_dune_autre_entreprise(): void
    {
        $user = User::factory()->create();
        $autreEntreprise = Entreprise::factory()->create();
        $rdvAutreEntreprise = RendezVous::factory()->create(['entreprise_id' => $autreEntreprise->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/rendez-vous/{$rdvAutreEntreprise->id}")
            ->assertForbidden();
    }

    public function test_liste_filtrable_par_statut(): void
    {
        $user = User::factory()->create();
        RendezVous::factory()->statut('confirme')->count(2)->create([
            'entreprise_id' => $user->entreprise_id,
            'cree_par_id' => $user->id,
        ]);
        RendezVous::factory()->statut('annule')->create([
            'entreprise_id' => $user->entreprise_id,
            'cree_par_id' => $user->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/rendez-vous?statut=confirme')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_suppression_est_une_soft_delete(): void
    {
        $user = User::factory()->create();
        $rdv = RendezVous::factory()->create([
            'entreprise_id' => $user->entreprise_id,
            'cree_par_id' => $user->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/rendez-vous/{$rdv->id}")
            ->assertOk();

        $this->assertSoftDeleted('rendez_vous', ['id' => $rdv->id]);
    }

    public function test_seul_le_proprietaire_peut_ajouter_une_assistante(): void
    {
        $assistante = User::factory()->create();

        $this->actingAs($assistante, 'sanctum')->postJson('/api/equipe', [
            'nom' => 'Nouvelle Assistante',
            'email' => 'nouvelle@demo.test',
            'password' => 'motdepasse123',
        ])->assertForbidden();

        $proprietaire = User::factory()->proprietaire()->create();

        $this->actingAs($proprietaire, 'sanctum')->postJson('/api/equipe', [
            'nom' => 'Nouvelle Assistante',
            'email' => 'nouvelle@demo.test',
            'password' => 'motdepasse123',
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'nouvelle@demo.test',
            'entreprise_id' => $proprietaire->entreprise_id,
            'role' => 'assistante',
        ]);
    }

    public function test_quota_restant_est_correctement_calcule(): void
    {
        $entreprise = Entreprise::factory()->create([
            'plan' => 'essentiel',
            'quota_mensuel' => 500,
            'quota_utilise' => 480,
            'quota_packs_supplementaires' => 1, // +100
        ]);
        $user = User::factory()->create(['entreprise_id' => $entreprise->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/quota')
            ->assertOk()
            ->assertJsonPath('data.quota_restant', 120); // (500+100) - 480
    }
}
