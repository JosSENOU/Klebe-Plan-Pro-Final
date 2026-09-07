/**
 * Client HTTP mutualisé pour l'espace assistante.
 *
 * Tant que les endpoints de Pinel (rendez-vous, équipe, permissions) et de
 * Bilal (auth, quota) ne sont pas exposés, `USE_MOCK` reste vrai et les
 * fonctions de `./auth`, `./team` et `./quota` répondent depuis des données
 * en mémoire. Le jour où l'API existe : renseigner VITE_API_URL, passer
 * USE_MOCK à false, et le reste du code (composants, types) ne change pas —
 * seule l'implémentation des fonctions dans ce dossier évolue.
 */

export const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "";

// Pas d'URL configurée => on reste en mode mock explicite plutôt que de
// laisser fetch() échouer silencieusement contre une base vide.
export const USE_MOCK = API_BASE_URL.length === 0;

// Le backend (Sanctum, mode "token API") renvoie un bearer token à
// stocker côté client — pas de session cookie. Clé alignée avec celle
// utilisée par FormulaireRDV.jsx (src/routes/rendez-vous.tsx).
const TOKEN_STORAGE_KEY = "token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    throw new ApiError(
      `apiFetch("${path}") appelé sans VITE_API_URL : implémentez d'abord l'endpoint réel ou passez par le mock correspondant.`,
    );
  }

  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : `Échec de la requête ${path} (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return body as T;
}

// Le backend enveloppe systématiquement ses réponses dans { data: ... }.
export function unwrap<T>(body: { data: T }): T {
  return body.data;
}

// Simule la latence réseau en mode mock, pour que les écrans exercent
// réellement leurs états de chargement avant le branchement API.
export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}