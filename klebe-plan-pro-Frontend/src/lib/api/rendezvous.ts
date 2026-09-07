import { apiFetch, mockDelay, unwrap, USE_MOCK } from "./client";

export type StatutRdv = "planifie" | "confirme" | "reporte" | "annule" | "manque" | "termine";

export const STATUT_LABELS: Record<StatutRdv, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  reporte: "Reporté",
  annule: "Annulé",
  manque: "Manqué",
  termine: "Terminé",
};

export type RendezVous = {
  id: number;
  nom: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  lieu: string | null;
  statut: StatutRdv;
  notes: string | null;
  cree_par?: { id: number; nom: string } | null;
  rappels: {
    veille_envoye: boolean;
    jour_j_envoye: boolean;
    "15min_envoye": boolean;
  };
  created_at: string | null;
  updated_at: string | null;
};

export type RendezVousInput = {
  nom: string;
  date: string;
  heure: string;
  lieu?: string | null;
  notes?: string | null;
  statut?: StatutRdv;
};

// Store en mémoire tenant lieu de base de données tant que USE_MOCK est actif
// (pas de VITE_API_URL). Réinitialisé à chaque rechargement.
let mockRdvs: RendezVous[] = [];

function emptyRappels() {
  return { veille_envoye: false, jour_j_envoye: false, "15min_envoye": false };
}

export async function listRendezVous(): Promise<RendezVous[]> {
  if (USE_MOCK) {
    await mockDelay();
    return [...mockRdvs];
  }
  const body = await apiFetch<{ data: RendezVous[] }>("/api/rendez-vous");
  return body.data;
}

export async function createRendezVous(input: RendezVousInput): Promise<RendezVous> {
  if (USE_MOCK) {
    await mockDelay();
    const rdv: RendezVous = {
      id: Date.now(),
      nom: input.nom,
      date: input.date,
      heure: input.heure,
      lieu: input.lieu ?? null,
      statut: input.statut ?? "planifie",
      notes: input.notes ?? null,
      rappels: emptyRappels(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockRdvs = [...mockRdvs, rdv];
    return rdv;
  }
  const body = await apiFetch<{ data: RendezVous }>("/api/rendez-vous", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return unwrap(body);
}

export async function updateRendezVous(id: number, input: RendezVousInput): Promise<RendezVous> {
  if (USE_MOCK) {
    await mockDelay();
    mockRdvs = mockRdvs.map((r) => (r.id === id ? { ...r, ...input, lieu: input.lieu ?? null } : r));
    return mockRdvs.find((r) => r.id === id)!;
  }
  const body = await apiFetch<{ data: RendezVous }>(`/api/rendez-vous/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return unwrap(body);
}

export async function removeRendezVous(id: number): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    mockRdvs = mockRdvs.filter((r) => r.id !== id);
    return;
  }
  await apiFetch<void>(`/api/rendez-vous/${id}`, { method: "DELETE" });
}
