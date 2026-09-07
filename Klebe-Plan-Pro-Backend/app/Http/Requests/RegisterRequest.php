<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation de l'inscription (tâche Bilal — Authentification).
 * Crée l'entreprise ET le premier compte "proprietaire" en une fois.
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route publique
    }

    public function rules(): array
    {
        return [
            'entreprise_nom' => ['required', 'string', 'max:255'],
            'telephone_dg' => ['required', 'string', 'max:30'],
            'nom_dg' => ['nullable', 'string', 'max:255'],

            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'telephone' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Un compte existe déjà avec cet email.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ];
    }
}
