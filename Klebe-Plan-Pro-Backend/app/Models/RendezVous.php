<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class RendezVous extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'entreprise_id',
        'cree_par_id',
        'nom',
        'date',
        'heure',
        'lieu',
        'statut',
        'notes',
        'rappel_veille_envoye_a',
        'rappel_jour_j_envoye_a',
        'rappel_15min_envoye_a',
    ];

    protected $casts = [
        'date' => 'date',
        'rappel_veille_envoye_a' => 'datetime',
        'rappel_jour_j_envoye_a' => 'datetime',
        'rappel_15min_envoye_a' => 'datetime',
    ];

    public const STATUTS = ['planifie', 'confirme', 'reporte', 'annule', 'manque', 'termine'];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function creePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par_id');
    }
}
