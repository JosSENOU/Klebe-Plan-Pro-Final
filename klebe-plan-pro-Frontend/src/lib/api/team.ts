import { apiFetch, mockDelay, unwrap, USE_MOCK } from "./client";

export type Role = "proprietaire" | "assistante";

export type Member = {
  id: number;
  name: string;
  email: string;
  telephone: string | null;
  title: string;
  role: Role;
  actif: boolean;
  initials: string;
  tone: "emerald" | "amber" | "coral" | "blue";
};

type BackendMember = {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  role: Role;
  actif: boolean;
};

export const SEAT_LIMIT = 5;

const tones = ["emerald", "amber", "coral", "blue"] as const;

// Store en mémoire tenant lieu de base de données en mode mock.
let mockMembers: Member[] = [
  {
    id: 1,
    name: "Josephine Senou",
    email: "josephine@klebe.pro",
    telephone: null,
    title: "Propriétaire",
    role: "proprietaire",
    actif: true,
    initials: "JS",
    tone: "emerald",
  },
  {
    id: 2,
    name: "Shalom Ahouandjinou",
    email: "shalom@klebe.pro",
    telephone: null,
    title: "Assistante rendez-vous",
    role: "assistante",
    actif: true,
    initials: "SA",
    tone: "blue",
  },
  {
    id: 3,
    name: "Keira Dossou",
    email: "keira@klebe.pro",
    telephone: null,
    title: "Assistante accès & quota",
    role: "assistante",
    actif: true,
    initials: "KD",
    tone: "amber",
  },
];

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("");
}

function mapBackendMember(raw: BackendMember, index: number): Member {
  return {
    id: raw.id,
    name: raw.nom,
    email: raw.email,
    telephone: raw.telephone,
    title: raw.role === "proprietaire" ? "Propriétaire" : "Assistante",
    role: raw.role,
    actif: raw.actif,
    initials: toInitials(raw.nom),
    tone: tones[index % tones.length]!,
  };
}

export async function listMembers(): Promise<Member[]> {
  if (USE_MOCK) {
    await mockDelay();
    return [...mockMembers];
  }
  const body = await apiFetch<{ data: BackendMember[] }>("/api/equipe");
  return unwrap(body).map(mapBackendMember);
}

export async function inviteMember(input: {
  name: string;
  email: string;
  telephone?: string;
  password: string;
}): Promise<Member> {
  if (input.name.trim().length < 3 || !input.email.includes("@")) {
    throw new Error("Renseignez un nom complet et une adresse e-mail valide.");
  }
  if (input.password.trim().length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  if (USE_MOCK) {
    await mockDelay();
    if (mockMembers.length >= SEAT_LIMIT) {
      throw new Error("Toutes les places de votre forfait sont occupées.");
    }
    const member: Member = {
      id: Date.now(),
      name: input.name.trim(),
      email: input.email.trim(),
      telephone: input.telephone?.trim() || null,
      title: "Assistante",
      role: "assistante",
      actif: true,
      initials: toInitials(input.name),
      tone: tones[mockMembers.length % tones.length]!,
    };
    mockMembers = [...mockMembers, member];
    return member;
  }

  const body = await apiFetch<{ data: BackendMember }>("/api/equipe", {
    method: "POST",
    body: JSON.stringify({
      nom: input.name.trim(),
      email: input.email.trim(),
      telephone: input.telephone?.trim() || undefined,
      password: input.password,
    }),
  });
  return mapBackendMember(unwrap(body), 0);
}

export async function removeMember(id: number): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    mockMembers = mockMembers.filter((member) => member.id !== id);
    return;
  }
  await apiFetch<void>(`/api/equipe/${id}`, { method: "DELETE" });
}

// Le backend n'a pas de niveaux d'accès (Administratrice/Éditrice/Lecture
// seule) : juste un statut actif/inactif par assistante (le propriétaire
// n'est jamais désactivable). On remplace donc updateMemberAccess par un
// simple bascule d'activation, alignée sur /api/equipe/{id}/(dés)activer.
export async function setMemberActive(id: number, actif: boolean): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    mockMembers = mockMembers.map((member) => (member.id === id ? { ...member, actif } : member));
    return;
  }
  await apiFetch<void>(`/api/equipe/${id}/${actif ? "reactiver" : "desactiver"}`, {
    method: "PATCH",
  });
}
