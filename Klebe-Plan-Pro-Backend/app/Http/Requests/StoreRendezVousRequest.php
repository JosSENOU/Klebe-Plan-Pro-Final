<?php

namespace App\Http\Requests;

use App\Models\RendezVous;
use Illuminate\Foundation\Http\FormRequest;

class StoreRendezVousRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Toute assistante ou propriétaire connecté peut créer un RDV
        // pour SA propre entreprise (voir RendezVousController).
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'heure' => ['required', 'date_format:H:i'],
            'lieu' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'statut' => ['nullable', 'in:' . implode(',', RendezVous::STATUTS)],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom du rendez-vous est obligatoire.',
            'date.required' => 'La date est obligatoire.',
            'date.after_or_equal' => 'La date ne peut pas être dans le passé.',
            'heure.required' => 'L\'heure est obligatoire.',
            'heure.date_format' => 'L\'heure doit être au format HH:MM.',
        ];
    }
}
