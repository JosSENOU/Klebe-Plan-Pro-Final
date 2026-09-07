import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Clock3,
  MessageCircleMore,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  changePlan,
  getQuotaSummary,
  PLAN_LABELS,
  PLAN_QUOTA,
  rechargeQuota,
  type Plan,
  type QuotaSummary,
} from "@/lib/api/quota";

export const Route = createFileRoute("/quota")({
  head: () => ({
    meta: [
      { title: "Quota de messages | Klébé Plan Pro" },
      {
        name: "description",
        content:
          "Suivez le nombre de messages WhatsApp restants, la consommation du mois et votre forfait Klébé Plan Pro.",
      },
      { property: "og:title", content: "Quota de messages | Klébé Plan Pro" },
      {
        property: "og:description",
        content: "Consommation, messages restants et recharge du forfait en un écran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotaPage,
});

function QuotaPage() {
  const [summary, setSummary] = useState<QuotaSummary | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [rechargingPack, setRechargingPack] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQuotaSummary().then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChangePlan(plan: Plan) {
    if (!summary || summary.plan === plan || changingPlan) return;
    setChangingPlan(true);
    try {
      const updated = await changePlan(plan);
      setSummary(updated);
      toast.success(`Forfait ${PLAN_LABELS[plan]} activé.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Le changement de forfait a échoué.");
    } finally {
      setChangingPlan(false);
    }
  }

  async function handleRecharge(packName: string, packCount: number) {
    if (rechargingPack) return;
    setRechargingPack(packName);
    try {
      const updated = await rechargeQuota(packCount);
      setSummary(updated);
      toast.success(`${packCount * 100} messages ajoutés à votre quota.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "La recharge a échoué.");
    } finally {
      setRechargingPack(null);
    }
  }

  if (!summary) {
    return (
      <AppShell breadcrumb="Quota">
        <div className="mx-auto max-w-[1480px] px-5 py-16 text-center text-sm text-muted-foreground md:px-8 lg:px-12">
          Chargement du quota…
        </div>
      </AppShell>
    );
  }

  const { included, used, breakdown: history, packs } = summary;
  const remaining = Math.max(0, included - used);
  const usedPercent = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0;

  return (
    <AppShell breadcrumb="Quota">
      <div className="mx-auto max-w-[1480px] px-5 py-8 md:px-8 lg:px-12 lg:py-10">
        <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-primary">
              Forfait {PLAN_LABELS[summary.plan]}
            </p>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">Messages restants</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {included} messages inclus ce mois-ci (forfait + packs).
            </p>
          </div>
          {summary.reached ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3.5" />
              Quota atteint — les rappels sont suspendus
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-soft px-3 py-2 text-xs font-medium text-success-foreground">
              <Check className="size-3.5" />
              Quota suffisant pour les rappels prévus
            </div>
          )}
        </section>

        <section className="mb-6 overflow-hidden rounded-lg border border-border bg-card shadow-surface">
          <div className="border-b border-border p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">Votre forfait</h2>
            <p className="mt-1 text-sm text-muted-foreground">Change à effet immédiat sur le quota mensuel inclus.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 md:p-6">
            {(Object.keys(PLAN_QUOTA) as Plan[]).map((plan) => {
              const active = summary.plan === plan;
              return (
                <button
                  key={plan}
                  type="button"
                  disabled={changingPlan || active}
                  onClick={() => handleChangePlan(plan)}
                  className={`rounded-lg border p-4 text-left transition-colors disabled:cursor-default ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{PLAN_LABELS[plan]}</span>
                    {active && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{PLAN_QUOTA[plan]} messages inclus / mois</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-lg border border-border bg-card p-6 shadow-surface">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Messages restants ce mois
                </p>
                <p className="mt-2 font-display text-5xl font-semibold text-card-foreground">
                  {remaining}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  sur {included} messages inclus dans votre forfait
                </p>
              </div>
              <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {usedPercent}% consommé
              </span>
            </div>

            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{used} envoyés</span>
              <span>{remaining} disponibles</span>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-notification" />
              <p>
                À l'épuisement du quota, l'envoi des rappels WhatsApp est suspendu jusqu'à la
                recharge ou au changement de forfait.
              </p>
            </div>
          </article>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard
              label="Envoyés ce mois"
              value={String(used)}
              detail="Tous rappels confondus"
              icon={MessageCircleMore}
              tone="primary"
            />
            {summary.deliveredCount !== undefined && (
              <StatCard
                label="Taux de livraison"
                value={`${((summary.deliveredCount / used) * 100).toFixed(1).replace(".", ",")}%`}
                detail={`${summary.deliveredCount} messages livrés`}
                icon={Check}
                tone="success"
              />
            )}
            {summary.scheduledNext7Days !== undefined && (
              <StatCard
                label="Programmés"
                value={String(summary.scheduledNext7Days)}
                detail="Pour les 7 prochains jours"
                icon={Clock3}
                tone="blue"
              />
            )}
          </div>
        </section>

        {history && history.length > 0 && (
          <section className="mb-6 overflow-hidden rounded-lg border border-border bg-card shadow-surface">
            <div className="border-b border-border p-5 md:p-6">
              <h2 className="font-display text-xl font-semibold">Répartition de la consommation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ce qui consomme votre quota ce mois-ci.
              </p>
            </div>
            <div className="divide-y divide-border">
              {history.map((item) => (
                <div key={item.label} className="flex items-center gap-4 px-5 py-4 md:px-6">
                  <span className={`metric-icon metric-icon-${item.tone}`}>
                    <TrendingUp className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.round((item.count / used) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 font-display text-xl font-semibold">Recharger votre quota</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {packs.map((pack) => (
              <article
                key={pack.name}
                className={`rounded-lg border bg-card p-5 shadow-surface transition-transform duration-200 hover:-translate-y-0.5 ${pack.highlight ? "border-primary" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{pack.name}</h3>
                  {pack.highlight && (
                    <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success-foreground">
                      Recommandé
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-2xl font-semibold text-card-foreground">
                  {pack.price}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{pack.detail}</p>
                <Button
                  variant={pack.highlight ? "default" : "outline"}
                  disabled={rechargingPack !== null}
                  onClick={() => handleRecharge(pack.name, pack.packs)}
                  className={`mt-5 h-10 w-full ${pack.highlight ? "shadow-brand" : ""}`}
                >
                  {rechargingPack === pack.name ? (
                    "Traitement…"
                  ) : (
                    <>
                      <Sparkles /> Choisir ce pack
                    </>
                  )}
                </Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Clock3;
  tone: "primary" | "blue" | "success" | "amber";
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-surface">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`metric-icon metric-icon-${tone}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="font-display text-2xl font-semibold text-card-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}
