<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Client WhatsApp Cloud API (Meta) — tâche Bilal.
 *
 * Utilisé par la commande de rappels (EnvoyerRappelsWhatsApp) pour envoyer
 * les 3 rappels automatiques au DG (veille 18h, jour J 8h, 15 min avant).
 *
 * Config attendue dans config/services.php > 'whatsapp' (voir fichier fourni) :
 *   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION (.env)
 */
class WhatsAppService
{
    private string $token;

    private string $phoneNumberId;

    private string $apiVersion;

    public function __construct()
    {
        $this->token = (string) config('services.whatsapp.token');
        $this->phoneNumberId = (string) config('services.whatsapp.phone_number_id');
        $this->apiVersion = (string) config('services.whatsapp.api_version', 'v21.0');
    }

    /**
     * Envoie un message texte simple via l'API WhatsApp Cloud.
     *
     * @param  string  $telephone  Numéro au format international, ex: "22990000000"
     *                             (le "+" est optionnel, l'API l'accepte sans).
     * @return bool true si le message a été accepté par l'API (statut 2xx).
     *
     * @throws RuntimeException si la config WhatsApp n'est pas renseignée,
     *                          ou si l'API renvoie une erreur.
     */
    public function envoyerMessage(string $telephone, string $message): bool
    {
        if ($this->token === '' || $this->phoneNumberId === '') {
            throw new RuntimeException(
                'Config WhatsApp manquante (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID dans .env).'
            );
        }

        $url = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";

        $reponse = Http::withToken($this->token)
            ->timeout(15)
            ->post($url, [
                'messaging_product' => 'whatsapp',
                'to' => $this->normaliserNumero($telephone),
                'type' => 'text',
                'text' => ['body' => $message],
            ]);

        if ($reponse->failed()) {
            Log::error('Échec envoi WhatsApp', [
                'telephone' => $telephone,
                'statut_http' => $reponse->status(),
                'reponse' => $reponse->json() ?? $reponse->body(),
            ]);

            throw new RuntimeException(
                "L'API WhatsApp a renvoyé une erreur (HTTP {$reponse->status()})."
            );
        }

        return true;
    }

    /**
     * Enlève les espaces / "+" éventuels : l'API WhatsApp veut le numéro en
     * chiffres uniquement (indicatif pays inclus, sans "+").
     */
    private function normaliserNumero(string $telephone): string
    {
        return preg_replace('/[^0-9]/', '', $telephone) ?? $telephone;
    }
}
