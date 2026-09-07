import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoAccounts, login } from "@/lib/api/auth";
import { USE_MOCK } from "@/lib/api/client";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion | Klébé Plan Pro" },
      {
        name: "description",
        content:
          "Connectez-vous à Klébé Plan Pro pour gérer les rendez-vous du DG et les rappels WhatsApp.",
      },
      { property: "og:title", content: "Connexion | Klébé Plan Pro" },
      {
        property: "og:description",
        content: "Accès sécurisé à l’espace de travail des assistantes de direction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identifiants incorrects. Réessayez.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-brand">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold leading-none">Klébé</p>
            <p className="mt-1 text-[10px] font-semibold uppercase text-sidebar-muted">Plan Pro</p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            L’assistant WhatsApp du DG qui ne rate plus aucun rendez-vous.
          </h2>
          <p className="mt-4 text-sm text-sidebar-muted">
            Saisissez le rendez-vous une seule fois : Klébé programme les trois rappels — la veille à
            18h, le jour J à 8h et 15 minutes avant.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            {["Agenda partagé avec votre équipe", "Rappels automatiques et fiables", "Suivi du quota de messages"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-sidebar-accent text-sidebar-primary">
                    <ShieldCheck className="size-3.5" />
                  </span>
                  <span className="text-sidebar-muted">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <p className="text-xs text-sidebar-muted">Sprint V1.3 · Cotonou, Bénin</p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-12 md:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-brand">
              <Sparkles className="size-5" />
            </div>
            <p className="font-display text-xl font-semibold">Klébé Plan Pro</p>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase text-primary">Espace assistante</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Connexion</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entrez vos identifiants pour accéder au tableau de bord.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 rounded-lg border border-border bg-card p-6 shadow-surface"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail professionnelle</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="assistante@entreprise.com"
                  className="h-11 bg-muted/40 pl-9 shadow-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <button type="button" className="text-xs font-semibold text-primary hover:opacity-80">
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-muted/40 pl-9 shadow-none"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="h-11 w-full shadow-brand">
              {loading ? <Loader2 className="animate-spin" /> : <Lock />}
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>

            {USE_MOCK && (
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase text-primary">
                  Comptes de démonstration (mode mock — VITE_API_URL non configuré)
                </p>
                <div className="space-y-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                        setError(null);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-md bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-card-foreground">
                          {account.email}
                        </span>
                        <span className="text-muted-foreground">
                          mot de passe : {account.password} · {account.role}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-primary">Remplir</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Accès réservé aux assistantes autorisées par la direction.
            </p>
          </form>

        </div>
      </section>
    </div>
  );
}
