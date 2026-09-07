<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table "entreprises" : le client SaaS (cabinet, PME, banque, ONG...).
 * Contient aussi le quota, car le quota est défini au niveau entreprise
 * (voir doc "Analyse stratégique", section 7 - Modèle économique).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('telephone_dg')->comment('Numéro WhatsApp du DG qui reçoit les rappels');
            $table->string('nom_dg')->nullable();

            // --- Abonnement / plan ---
            $table->enum('plan', ['essentiel', 'business'])->default('essentiel');
            $table->timestamp('plan_actif_jusqu_au')->nullable();

            // --- Quota de messages (voir doc: 500 messages Essentiel, 2500 Business) ---
            $table->unsignedInteger('quota_mensuel')->default(500);
            $table->unsignedInteger('quota_utilise')->default(0);
            $table->unsignedInteger('quota_packs_supplementaires')->default(0)
                ->comment('Messages achetés en plus via des packs (100 messages / pack)');
            $table->timestamp('quota_reinitialise_le')->nullable()
                ->comment('Date du prochain reset mensuel du quota');

            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprises');
    }
};
