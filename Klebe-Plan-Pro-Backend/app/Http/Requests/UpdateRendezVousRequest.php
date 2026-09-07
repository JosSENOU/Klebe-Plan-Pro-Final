<?php

namespace App\Http\Requests;

use App\Models\RendezVous;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRendezVousRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La vérification "même entreprise" se fait via RendezVousPolicy,
        // appelée explicitement dans le contrôleur.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'date' => ['sometimes', 'required', 'date'],
            'heure' => ['sometimes', 'required', 'date_format:H:i'],
            'lieu' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'statut' => ['sometimes', 'required', 'in:' . implode(',', RendezVous::STATUTS)],
        ];
    }
}
