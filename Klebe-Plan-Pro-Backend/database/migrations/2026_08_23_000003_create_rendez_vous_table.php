<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table "rendez_vous" : coeur du produit.
 * Statuts enrichis par rapport au simple "Fait" du MVP (voir doc
 * "Analyse stratégique", section 3 - Faiblesses : "Statut Fait trop simple").
 * On les prévoit dès la V1.3 car ça ne coûte rien de plus et ça évite
 * une migration supplémentaire plus tard.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->constrained('entreprises')->cascadeOnDelete();
            $table->foreignId('cree_par_id')->constrained('users')->comment('Assistante qui a créé le RDV');

            $table->string('nom');
            $table->date('date');
            $table->time('heure');
            $table->string('lieu')->nullable();

            $table->enum('statut', [
                'planifie',   // par défaut à la création
                'confirme',
                'reporte',
                'annule',
                'manque',
                'termine',
            ])->default('planifie');

            // --- Suivi des 3 rappels (utile pour le dashboard + pour Bilal/scheduler) ---
            $table->timestamp('rappel_veille_envoye_a')->nullable();
            $table->timestamp('rappel_jour_j_envoye_a')->nullable();
            $table->timestamp('rappel_15min_envoye_a')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes()->comment('Suppression douce: on garde l\'historique des RDV supprimés');

            $table->index(['entreprise_id', 'date']);
            $table->index(['entreprise_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous');
    }
};
