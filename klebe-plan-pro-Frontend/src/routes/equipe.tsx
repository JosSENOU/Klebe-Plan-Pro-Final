import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type Member,
  SEAT_LIMIT,
  inviteMember,
  listMembers,
  removeMember as removeMemberRequest,
  setMemberActive,
} from "@/lib/api/team";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Gestion d’équipe | Klébé Plan Pro" },
      {
        name: "description",
        content:
          "Ajoutez ou retirez des assistantes et gérez leurs niveaux d’accès dans Klébé Plan Pro.",
      },
      { property: "og:title", content: "Gestion d’équipe | Klébé Plan Pro" },
      {
        property: "og:description",
        content: "Contrôlez qui peut créer et suivre les rendez-vous du DG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMembers().then((result) => {
      if (!cancelled) {
        setMembers(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const member = await inviteMember({ name, email, password });
      setMembers((current) => [...current, member]);
      setName("");
      setEmail("");
      setPassword("");
      setError(null);
      setInviteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (id: number) => {
    const previous = members;
    setMembers((current) => current.filter((member) => member.id !== id));
    try {
      await removeMemberRequest(id);
    } catch {
      setMembers(previous);
    }
  };

  const toggleActive = async (id: number, actif: boolean) => {
    const previous = members;
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, actif } : member)));
    try {
      await setMemberActive(id, actif);
    } catch {
      setMembers(previous);
    }
  };

  return (
    <AppShell
      breadcrumb="Équipe"
      actions={
        <Button className="h-10 shadow-brand" onClick={() => setInviteOpen((open) => !open)}>
          <Plus />
          <span className="hidden sm:inline">Inviter une assistante</span>
          <span className="sm:hidden">Inviter</span>
        </Button>
      }
    >
      <div className="mx-auto max-w-[1480px] px-5 py-8 md:px-8 lg:px-12 lg:py-10">
        <section className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase text-primary">Administration</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Gestion d’équipe</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Ajoutez ou retirez des assistantes et gérez leur accès au tableau de bord.
          </p>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Membres actifs"
            value={String(members.length).padStart(2, "0")}
            detail={`Sur ${SEAT_LIMIT} places incluses`}
            icon={Users}
            tone="primary"
          />
          <StatCard
            label="Actives"
            value={String(members.filter((m) => m.actif).length).padStart(2, "0")}
            detail="Assistantes ayant accès au tableau de bord"
            icon={ShieldCheck}
            tone="success"
          />
          <StatCard
            label="Places disponibles"
            value={String(Math.max(SEAT_LIMIT - members.length, 0)).padStart(2, "0")}
            detail="Ajoutez une assistante à tout moment"
            icon={UserPlus}
            tone="blue"
          />
        </section>

        {inviteOpen && (
          <section className="mb-6 rounded-lg border border-border bg-card p-5 shadow-surface md:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Inviter une assistante</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Définissez son mot de passe initial ; elle pourra le changer ensuite.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                onClick={() => setInviteOpen(false)}
              >
                <X />
              </Button>
            </div>
            <form
              onSubmit={addMember}
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="member-name">Nom complet</Label>
                <Input
                  id="member-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex. Aïcha Mensah"
                  className="h-11 bg-muted/40 shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Adresse e-mail</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="aicha@entreprise.com"
                  className="h-11 bg-muted/40 shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-password">Mot de passe</Label>
                <Input
                  id="member-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8 caractères minimum"
                  className="h-11 bg-muted/40 shadow-none md:w-48"
                />
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive md:col-span-3">
                  {error}
                </p>
              )}
              <div className="md:col-span-3">
                <Button type="submit" disabled={submitting} className="h-11 shadow-brand">
                  <UserPlus /> {submitting ? "Envoi…" : "Envoyer l’invitation"}
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-surface">
          <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center md:p-6">
            <div>
              <h2 className="font-display text-xl font-semibold">Membres de l’équipe</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les assistantes listées ici peuvent accéder à l’agenda du DG.
              </p>
            </div>
            <span className="w-fit rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success-foreground">
              {members.length} / {SEAT_LIMIT} places
            </span>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Chargement de l’équipe…
              </div>
            ) : members.length > 0 ? (
              members.map((member) => (
                <article
                  key={member.id}
                  className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center md:px-6"
                >
                  <div className={`avatar avatar-${member.tone}`}>{member.initials}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-card-foreground">
                      {member.name}
                    </h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {member.email} · {member.title}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${member.actif ? "status-confirmed" : "status-completed"}`}
                  >
                    {member.actif ? "Actif" : "Inactif"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:justify-self-end"
                        aria-label={`Gérer ${member.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {member.role !== "proprietaire" && (
                        <DropdownMenuItem onClick={() => toggleActive(member.id, !member.actif)}>
                          {member.actif ? "Désactiver" : "Réactiver"}
                        </DropdownMenuItem>
                      )}
                      {member.role !== "proprietaire" && (
                        <DropdownMenuItem onClick={() => removeMember(member.id)}>
                          Retirer de l’équipe
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              ))
            ) : (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-3 size-6 text-muted-foreground" />
                <p className="font-medium">Aucune assistante dans l’équipe</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invitez une assistante pour lui donner accès au tableau de bord.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-4 text-xs text-muted-foreground md:px-6">
            <span>{members.length} membre(s) affiché(s)</span>
            <span>Permissions synchronisées avec l’API équipe</span>
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
  icon: typeof Users;
  tone: "primary" | "blue" | "success" | "amber";
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-surface transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-5 flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`metric-icon metric-icon-${tone}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="font-display text-3xl font-semibold text-card-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}