import { apiFetch, mockDelay, unwrap, USE_MOCK } from "./client";

export type NotificationLevel = "urgent" | "info";

export type AppNotification = {
  id: string;
  rendez_vous_id: number;
  niveau: NotificationLevel;
  titre: string;
  message: string;
  rappel_jour_j_envoye: boolean;
  rappel_15min_envoye: boolean;
};

// Mode mock : pas de RDV en mémoire au démarrage (voir lib/api/rendezvous.ts),
// donc pas de notification à simuler tant qu'aucun RDV mock n'est créé.
export async function getNotifications(): Promise<AppNotification[]> {
  if (USE_MOCK) {
    await mockDelay();
    return [];
  }
  const body = await apiFetch<{ data: AppNotification[] }>("/api/notifications");
  return unwrap(body);
}
