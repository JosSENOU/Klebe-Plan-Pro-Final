import { apiFetch, mockDelay, unwrap, USE_MOCK } from "./client";

export type Plan = "essentiel" | "business";

export type QuotaBreakdownItem = {
  label: string;
  count: number;
  tone: "primary" | "blue" | "amber" | "success";
};

export type QuotaPack = {
  name: string;
  price: string;
  detail: string;
  packs: number;
  highlight?: boolean;
};

// `deliveredCount`, `scheduledNext7Days` et `breakdown` restent optionnels :
// le backend ne renvoie que les compteurs globaux (voir routes/quota.tsx).
export type QuotaSummary = {
  plan: Plan;
  included: number;
  used: number;
  reached: boolean;
  deliveredCount?: number;
  scheduledNext7Days?: number;
  breakdown?: QuotaBreakdownItem[];
  packs: QuotaPack[];
};

export const PLAN_LABELS: Record<Plan, string> = {
  essentiel: "Essentiel",
  business: "Business",
};

export const PLAN_QUOTA: Record<Plan, number> = {
  essentiel: 500,
  business: 2500,
};

// Catalogue de recharge : contenu produit/marketing statique. `packs` indique
// combien de packs de 100 messages chaque offre crédite côté backend.
const packs: QuotaPack[] = [
  { name: "Pack 250 messages", price: "15 000 FCFA", detail: "Idéal pour un mois chargé", packs: 3 },
  { name: "Pack 500 messages", price: "27 000 FCFA", detail: "Le plus utilisé", packs: 5, highlight: true },
  { name: "Pack 1 000 messages", price: "48 000 FCFA", detail: "Pour plusieurs DG", packs: 10 },
];

let mockPlan: Plan = "essentiel";
let mockUsed = 132;
let mockExtraPacks = 0;

// En mode mock uniquement : simule aussi le détail (breakdown/livraison)
// que le backend réel n'expose pas encore.
function buildMockSummary(): QuotaSummary {
  const included = PLAN_QUOTA[mockPlan] + mockExtraPacks * 100;
  return {
    plan: mockPlan,
    included,
    used: mockUsed,
    reached: mockUsed >= included,
    deliveredCount: 129,
    scheduledNext7Days: 14,
    breakdown: [
      { label: "Rappels la veille (18:00)", count: 54, tone: "primary" },
      { label: "Rappels du jour J (08:00)", count: 51, tone: "blue" },
      { label: "Rappels imminents (15 min avant)", count: 24, tone: "amber" },
      { label: "Confirmations reçues", count: 3, tone: "success" },
    ],
    packs,
  };
}

// Forme réelle de { data: {...} } renvoyée par GET/PATCH/POST /api/quota*
// (voir app/Http/Controllers/Api/QuotaController.php).
type QuotaResponseData = {
  plan: Plan;
  quota_mensuel: number;
  quota_utilise: number;
  quota_packs_supplementaires: number;
  quota_restant: number;
  quota_atteint: boolean;
  reinitialise_le: string | null;
};

function fromResponse(data: QuotaResponseData): QuotaSummary {
  // Un "pack supplémentaire" vaut 100 messages (voir Entreprise::quotaRestant()
  // côté backend) : quota_packs_supplementaires est un NOMBRE DE PACKS, pas un
  // nombre de messages — il faut multiplier par 100.
  return {
    plan: data.plan,
    included: data.quota_mensuel + data.quota_packs_supplementaires * 100,
    used: data.quota_utilise,
    reached: data.quota_atteint,
    packs,
  };
}

export async function getQuotaSummary(): Promise<QuotaSummary> {
  if (USE_MOCK) {
    await mockDelay();
    return buildMockSummary();
  }
  const body = await apiFetch<{ data: QuotaResponseData }>("/api/quota");
  return fromResponse(unwrap(body));
}

export async function changePlan(plan: Plan): Promise<QuotaSummary> {
  if (USE_MOCK) {
    await mockDelay();
    mockPlan = plan;
    return buildMockSummary();
  }
  const body = await apiFetch<{ data: QuotaResponseData }>("/api/quota/plan", {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
  return fromResponse(unwrap(body));
}

export async function rechargeQuota(packCount: number): Promise<QuotaSummary> {
  if (USE_MOCK) {
    await mockDelay();
    mockExtraPacks += packCount;
    return buildMockSummary();
  }
  const body = await apiFetch<{ data: QuotaResponseData }>("/api/quota/recharge", {
    method: "POST",
    body: JSON.stringify({ packs: packCount }),
  });
  return fromResponse(unwrap(body));
}
