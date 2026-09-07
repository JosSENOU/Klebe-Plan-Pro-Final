import { apiFetch, mockDelay, setStoredToken, unwrap, USE_MOCK } from "./client";

export type DemoAccount = {
  email: string;
  password: string;
  role: string;
};

// Utile uniquement en mode mock (pas de backend joignable / VITE_API_URL absent).
export const demoAccounts: DemoAccount[] = [
  { email: "josephine@klebe.pro", password: "klebe2026", role: "Administratrice" },
  { email: "shalom@klebe.pro", password: "klebe2026", role: "Éditrice" },
  { email: "keira@klebe.pro", password: "klebe2026", role: "Éditrice" },
];

export type LoginResult = {
  email: string;
  role: string;
};

// Forme réelle de { data: { user, token } } renvoyée par /api/login et /api/register.
type AuthResponseData = {
  user: { email: string; role: "proprietaire" | "assistante"; nom: string };
  token: string;
};

function toLoginResult(data: AuthResponseData): LoginResult {
  setStoredToken(data.token);
  return {
    email: data.user.email,
    role: data.user.role === "proprietaire" ? "Administratrice" : "Éditrice",
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (USE_MOCK) {
    await mockDelay();
    const account = demoAccounts.find(
      (item) => item.email === normalizedEmail && item.password === password,
    );
    if (!account) {
      throw new Error("Identifiants incorrects. Utilisez un compte de démonstration ci-dessous.");
    }
    return { email: account.email, role: account.role };
  }

  const body = await apiFetch<{ data: AuthResponseData }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
  return toLoginResult(unwrap(body));
}

// POST /api/register — crée l'entreprise ET le compte "proprietaire".
// Pas encore relié à un écran (pas de page d'inscription dans le front pour
// l'instant) ; exposé pour que l'écran d'inscription à venir n'ait qu'à
// appeler cette fonction.
export async function register(input: {
  entreprise_nom: string;
  telephone_dg: string;
  nom_dg?: string;
  nom: string;
  email: string;
  password: string;
  telephone?: string;
}): Promise<LoginResult> {
  const body = await apiFetch<{ data: AuthResponseData }>("/api/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toLoginResult(unwrap(body));
}

export async function logout(): Promise<void> {
  if (USE_MOCK) {
    setStoredToken(null);
    return;
  }
  try {
    await apiFetch<void>("/api/logout", { method: "POST" });
  } finally {
    setStoredToken(null);
  }
}