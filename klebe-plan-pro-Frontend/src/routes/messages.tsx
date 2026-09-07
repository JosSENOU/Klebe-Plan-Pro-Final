import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Check, Clock3, Mail, MessageCircleMore } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMessages, updateMessages, type MessageType, type MessagesSummary } from "@/lib/api/messages";
import { getNotifications, type AppNotification } from "@/lib/api/notifications";
import { getQuotaSummary, type QuotaSummary } from "@/lib/api/quota";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Rappels WhatsApp | Klébé Plan Pro" },
      {
        name: "description",
        content:
          "Contrôlez la séquence de rappels WhatsApp envoyés avant chaque rendez-vous du DG.",
      },
      { property: "og:title", content: "Rappels WhatsApp | Klébé Plan Pro" },
      {
        property: "og:description",
        content: "Trois rappels automatiques programmés pour chaque rendez-vous.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

const MESSAGE_META: Record<MessageType, { title: string; timing: string; icon: typeof Mail }> = {
  veille: { title: "Rappel — veille du rendez-vous", timing: "Envoyé la veille à 18:00", icon: Mail },
  jour_j: { title: "Rappel — matin du rendez-vous", timing: "Envoyé le jour J à 08:00", icon: Mail },
  "15min": { title: "Rappel — imminent", timing: "Envoyé 15 minutes avant", icon: Bell },
};

const MESSAGE_ORDER: MessageType[] = ["veille", "jour_j", "15min"];

function MessagesPage() {
  const [messages, setMessages] = useState<MessagesSummary | null>(null);
  const [quota, setQuota] = useState<QuotaSummary | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<MessageType | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function refreshNotifications() {
      getNotifications()
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .catch(() => {
          if (!cancelled) setNotifications([]);
        });
    }

    Promise.all([getMessages(), getQuotaSummary()])
      .then(([msgs, q]) => {
        if (!cancelled) {
          setMessages(msgs);
          setQuota(q);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger les messages.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Rendez-vous du jour même / proches : rechargé au montage puis toutes
    // les 60s pour refléter les créations/modifications faites entre-temps
    // sur la page Rendez-vous (pas de websocket, on poll simplement).
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  function openEdit(type: MessageType) {
    if (!messages) return;
    setEditing(type);
    setDraft(messages[type].template);
    setFormError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    if (!draft.trim()) {
      setFormError("Le message ne peut pas être vide.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateMessages({ [editing]: draft.trim() });
      setMessages(updated);
      toast.success("Message mis à jour.");
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "La sauvegarde a échoué. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell breadcrumb="Messages">
      <div className="mx-auto max-w-[1480px] px-5 py-8 md:px-8 lg:px-12 lg:py-10">
        <section className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase text-primary">WhatsApp</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Messages</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Contrôlez les rappels automatiques envoyés au DG.
          </p>
        </section>

        {notifications.length > 0 && (
          <section className="mb-6 overflow-hidden rounded-lg border border-notification/30 bg-notification/5 shadow-surface">
            <div className="flex items-center gap-2 border-b border-notification/20 px-5 py-3 md:px-6">
              <Bell className="size-4 text-notification" />
              <h2 className="text-sm font-semibold text-notification">
                {notifications.length} rendez-vous à surveiller aujourd'hui ou demain
              </h2>
            </div>
            <div className="divide-y divide-notification/10">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  to="/"
                  className="flex items-start justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-notification/10 md:px-6"
                >
                  <div>
                    <p className="font-medium text-foreground">{notif.titre}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
                  </div>
                  {notif.niveau === "urgent" && (
                    <span className="shrink-0 rounded-full bg-notification px-2 py-0.5 text-[10px] font-semibold text-notification-foreground">
                      Aujourd'hui
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {quota && (
          <section className="mb-6 grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Utilisés ce mois"
              value={String(quota.used)}
              detail={`Sur ${quota.included} messages inclus`}
              icon={MessageCircleMore}
              tone="success"
            />
            <MetricCard
              label="Restants"
              value={String(Math.max(0, quota.included - quota.used))}
              detail="Avant d'atteindre le quota"
              icon={Check}
              tone="primary"
            />
            <MetricCard
              label="Rappels par RDV"
              value="3"
              detail="Veille, jour J, 15 min avant"
              icon={Clock3}
              tone="amber"
            />
          </section>
        )}

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-surface">
          <div className="border-b border-border p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">Séquence de rappels</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les trois messages programmés pour chaque rendez-vous. Tokens disponibles : {"{nom}"} {"{date}"} {"{heure}"} {"{lieu}"}.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Chargement des messages…</div>
          ) : loadError ? (
            <div className="py-16 text-center">
              <p className="font-medium text-destructive">{loadError}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {MESSAGE_ORDER.map((type) => {
                const meta = MESSAGE_META[type];
                const Icon = meta.icon;
                const entry = messages?.[type];
                return (
                  <article
                    key={type}
                    className="grid gap-4 px-5 py-5 md:grid-cols-[auto_1fr_auto] md:items-center md:px-6"
                  >
                    <div className="grid size-11 place-items-center rounded-md bg-success-soft text-success-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{meta.title}</h3>
                        <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                          {entry?.personnalise ? "Personnalisé" : "Par défaut"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{meta.timing}</p>
                      <p className="mt-2 text-sm text-foreground">{entry?.template}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(type)}>
                      Modifier
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? MESSAGE_META[editing].title : ""}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message-draft">Texte du message</Label>
              <Textarea
                id="message-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                className="bg-muted/40 shadow-none"
              />
              <p className="text-xs text-muted-foreground">
                Tokens disponibles : {"{nom}"} {"{date}"} {"{heure}"} {"{lieu}"} — remplacés automatiquement à l'envoi.
              </p>
            </div>
            {formError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="shadow-brand">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
