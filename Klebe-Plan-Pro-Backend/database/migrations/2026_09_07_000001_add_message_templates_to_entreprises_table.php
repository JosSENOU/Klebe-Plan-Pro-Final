<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute les 3 modèles de messages WhatsApp personnalisables par entreprise
 * (page "Messages" du front, jusqu'ici une maquette statique sans backend).
 * NULL = on utilise le modèle par défaut codé dans Entreprise::TEMPLATES_DEFAUT.
 * Tokens disponibles dans le texte : {nom} {date} {heure} {lieu}
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->string('message_veille', 500)->nullable()->after('quota_reinitialise_le');
            $table->string('message_jour_j', 500)->nullable()->after('message_veille');
            $table->string('message_15min', 500)->nullable()->after('message_jour_j');
        });
    }

    public function down(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->dropColumn(['message_veille', 'message_jour_j', 'message_15min']);
        });
    }
};
