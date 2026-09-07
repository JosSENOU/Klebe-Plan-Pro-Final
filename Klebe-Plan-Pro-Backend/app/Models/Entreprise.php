<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'telephone_dg',
        'nom_dg',
        'plan',
        'plan_actif_jusqu_au',
        'quota_mensuel',
        'quota_utilise',
        'quota_packs_supplementaires',
        'quota_reinitialise_le',
        'message_veille',
        'message_jour_j',
        'message_15min',
        'actif',
    ];

    /**
     * Modèles par défaut utilisés tant que l'entreprise n'a pas personnalisé
     * ses messages (colonnes message_* à NULL). Tokens : {nom} {date} {heure} {lieu}
     */
    public const TEMPLATES_DEFAUT = [
        'veille' => 'Rappel : rendez-vous "{nom}" demain à {heure} ({lieu}).',
        'jour_j' => 'Rappel : rendez-vous "{nom}" aujourd\'hui à {heure} ({lieu}).',
        '15min' => 'Rappel : rendez-vous "{nom}" dans 15 minutes à {heure} ({lieu}).',
    ];

    /** Quota mensuel inclus selon le plan (voir doc "Analyse stratégique"). */
    public const QUOTA_PAR_PLAN = [
        'essentiel' => 500,
        'business' => 2500,
    ];

    protected $casts = [
        'plan_actif_jusqu_au' => 'datetime',
        'quota_reinitialise_le' => 'datetime',
        'actif' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }

    /**
     * Nombre de messages encore disponibles ce mois-ci.
     * (quota inclus dans le plan + packs achetés) - messages déjà utilisés.
     */
    public function quotaRestant(): int
    {
        $total = $this->quota_mensuel + ($this->quota_packs_supplementaires * 100);

        return max(0, $total - $this->quota_utilise);
    }

    public function quotaAtteint(): bool
    {
        return $this->quotaRestant() <= 0;
    }

    /**
     * Change de plan et ajuste le quota mensuel inclus en conséquence.
     * quota_utilise et les packs déjà achetés ne sont pas touchés.
     */
    public function changerPlan(string $plan): void
    {
        $this->update([
            'plan' => $plan,
            'quota_mensuel' => self::QUOTA_PAR_PLAN[$plan],
        ]);
    }

    /** Recharge : ajoute des packs de 100 messages au quota du mois en cours. */
    public function ajouterPacks(int $nombrePacks): void
    {
        $this->increment('quota_packs_supplementaires', $nombrePacks);
    }

    /**
     * Template brut (personnalisé ou par défaut) pour un type de rappel.
     * $type ∈ 'veille' | 'jour_j' | '15min'
     */
    public function messageTemplate(string $type): string
    {
        $colonne = 'message_'.$type;

        return $this->{$colonne} ?: self::TEMPLATES_DEFAUT[$type];
    }

    /**
     * Remplace les tokens {nom} {date} {heure} {lieu} dans le template par
     * les valeurs réelles du rendez-vous.
     */
    public function rendreMessage(string $type, RendezVous $rdv): string
    {
        $template = $this->messageTemplate($type);

        return strtr($template, [
            '{nom}' => $rdv->nom,
            '{date}' => $rdv->date->format('d/m/Y'),
            '{heure}' => \Carbon\Carbon::parse($rdv->heure)->format('H:i'),
            '{lieu}' => $rdv->lieu ?: 'non précisé',
        ]);
    }
}
