<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table "users" : les assistantes (et le compte propriétaire) qui se
 * connectent au dashboard. Rattachées à une entreprise.
 * Gère aussi le rôle -> base des "permissions d'équipe".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->constrained('entreprises')->cascadeOnDelete();

            $table->string('nom');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('telephone')->nullable();

            // proprietaire = a créé le compte entreprise, gère l'équipe et le quota
            // assistante   = saisit/modifie les rendez-vous uniquement
            $table->enum('role', ['proprietaire', 'assistante'])->default('assistante');

            $table->boolean('actif')->default(true)
                ->comment('Permet de désactiver une assistante sans la supprimer');

            $table->rememberToken();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            // Table standard Sanctum, nécessaire pour l'auth API (tâche de Bilal),
            // créée ici pour que la structure BDD soit complète dès le départ.
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
