import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  MessageCircleMore,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRendezVous,
  listRendezVous,
  removeRendezVous,
  STATUT_LABELS,
  updateRendezVous,
  type RendezVous,
  type RendezVousInput,
  type StatutRdv,
} from "@/lib/api/rendezvous";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord | Klébé Plan Pro" },
      {
        name: "description",
        content: "Pilotez les rendez-vous de votre direction et les rappels WhatsApp depuis Klébé Plan Pro.",
      },
      { property: "og:title", content: "Tableau de bord | Klébé Plan Pro" },
      {
        property: "og:description",
        content: "Agenda, statuts et rappels WhatsApp réunis dans un tableau de bord clair.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const STATUS_CLASS: Record<StatutRdv, string> = {
  planifie: "status-upcoming",
  confirme: "status-confirmed",
  reporte: "status-pending",
  manque: "status-pending",
  annule: "status-completed",
  termine: "status-completed",
};

const emptyForm: RendezVousInput = { nom: "", date: "", heure: "", lieu: "" };

function dateGroupLabel(dateIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateIso}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return "Demain";
  return target.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function isSameDay(dateIso: string, reference: Date): boolean {
  const target = new Date(`${dateIso}T00:00:00`);
  return (
    target.getFullYear() === reference.getFullYear() &&
    target.getMonth() === reference.getMonth() &&
    target.getDate() === reference.getDate()
  );
}

function isWithinNextDays(dateIso: string, days: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateIso}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= days;
}

function initialsFor(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function reminderLabel(rdv: RendezVous): string {
  if (rdv.rappels["15min_envoye"]) return "Dernier rappel envoyé (J − 15 min)";
  if (rdv.rappels.jour_j_envoye) return "Rappel du jour J envoyé";
  if (rdv.rappels.veille_envoye) return "Rappel de la veille envoyé";
  return "Aucun rappel envoyé pour le moment";
}

function validate(form: RendezVousInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form["nom"].trim()) errors["nom"] = "Le nom est requis.";
  if (!form["date"]) {
    errors["date"] = "La date est requise.";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(`${form["date"]}T00:00:00`);
    if (chosen < today) errors["date"] = "La date ne peut pas être dans le passé.";
  }
  if (!form["heure"]) errors["heure"] = "L’heure est requise.";
  return errors;
}

function Dashboard() {
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"Tous" | StatutRdv>("Tous");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RendezVousInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listRendezVous()
      .then((data) => {
        if (!cancelled) setAppointments(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger les rendez-vous.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return appointments
      .filter((rdv) => {
        const matchesQuery =
          !normalizedQuery ||
          `${rdv.nom} ${rdv.lieu ?? ""}`.toLocaleLowerCase("fr").includes(normalizedQuery);
        const matchesFilter = activeFilter === "Tous" || rdv.statut === activeFilter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => `${a.date}T${a.heure}`.localeCompare(`${b.date}T${b.heure}`));
  }, [activeFilter, appointments, query]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = appointments.filter((r) => isSameDay(r.date, today)).length;
  const upcomingCount = appointments.filter((r) => isWithinNextDays(r.date, 7)).length;
  const confirmedCount = appointments.filter((r) => r.statut === "confirme").length;
  const pendingCount = appointments.filter((r) => r.statut === "planifie").length;
  const confirmationRate = appointments.length
    ? Math.round((confirmedCount / appointments.length) * 100)
    : 0;

  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setFormError(null);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(rdv: RendezVous) {
    setForm({ nom: rdv.nom, date: rdv.date, heure: rdv.heure, lieu: rdv.lieu ?? "" });
    setErrors({});
    setFormError(null);
    setEditingId(rdv.id);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId === null) {
        const created = await createRendezVous(form);
        setAppointments((current) => [...current, created]);
      } else {
        const updated = await updateRendezVous(editingId, form);
        setAppointments((current) => current.map((r) => (r.id === editingId ? updated : r)));
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const previous = appointments;
    setAppointments((current) => current.filter((r) => r.id !== id));
    try {
      await removeRendezVous(id);
      toast.success("Rendez-vous supprimé.");
    } catch (err) {
      setAppointments(previous);
      toast.error(err instanceof Error ? err.message : "La suppression a échoué. Réessayez.");
    }
  }

  async function handleStatusChange(id: number, statut: StatutRdv) {
    const target = appointments.find((r) => r.id === id);
    if (!target) return;
    const previous = appointments;
    setAppointments((current) => current.map((r) => (r.id === id ? { ...r, statut } : r)));
    try {
      await updateRendezVous(id, {
        nom: target.nom,
        date: target.date,
        heure: target.heure,
        lieu: target.lieu,
        notes: target.notes,
        statut,
      });
      toast.success(`Rendez-vous marqué « ${STATUT_LABELS[statut]} ».`);
    } catch (err) {
      setAppointments(previous);
      toast.error(err instanceof Error ? err.message : "Le changement de statut a échoué. Réessayez.");
    }
  }

  return (
    <AppShell
      breadcrumb="Rendez-vous"
      actions={
        <Button className="h-10 shadow-brand" onClick={openCreate}>
          <Plus />
          <span className="hidden sm:inline">Nouveau rendez-vous</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      }
    >
      <div className="mx-auto max-w-[1480px] px-5 py-8 md:px-8 lg:px-12 lg:py-10">
        <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              {today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Bonjour.</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Voici ce qui mérite votre attention aujourd’hui.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-soft px-3 py-2 text-xs font-medium text-success-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Données connectées à l’API réelle
          </div>
        </section>

        <section className="mb-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résumé des rendez-vous">
          <MetricCard label="Aujourd’hui" value={String(todayCount).padStart(2, "0")} detail="Rendez-vous du jour" icon={CalendarDays} tone="primary" />
          <MetricCard label="À venir" value={String(upcomingCount).padStart(2, "0")} detail="Sur les 7 prochains jours" icon={Clock3} tone="blue" />
          <MetricCard label="Confirmés" value={String(confirmedCount).padStart(2, "0")} detail={`${confirmationRate}% de confirmation`} icon={Check} tone="success" />
          <MetricCard label="À confirmer" value={String(pendingCount).padStart(2, "0")} detail="Statut planifié" icon={Bell} tone="amber" />
        </section>

        <section id="rendez-vous" className="overflow-hidden rounded-lg border border-border bg-card shadow-surface">
          <div className="border-b border-border p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-display text-xl font-semibold text-card-foreground">Rendez-vous</h2>
                <p className="mt-1 text-sm text-muted-foreground">Suivez les prochains temps forts du DG.</p>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un rendez-vous"
                  className="h-10 bg-muted/50 pl-9 shadow-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-1 overflow-x-auto" role="tablist" aria-label="Filtrer les rendez-vous">
              {(["Tous", "planifie", "confirme", "reporte", "manque", "termine", "annule"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className={activeFilter === filter ? "text-foreground" : "text-muted-foreground"}
                >
                  {filter === "Tous" ? "Tous" : STATUT_LABELS[filter]}
                </Button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Chargement des rendez-vous…</div>
            ) : loadError ? (
              <div className="py-16 text-center">
                <p className="font-medium text-destructive">{loadError}</p>
              </div>
            ) : visibleAppointments.length > 0 ? (
              visibleAppointments.map((rdv) => (
                <AppointmentRow
                  key={rdv.id}
                  rdv={rdv}
                  onEdit={() => openEdit(rdv)}
                  onDelete={() => handleDelete(rdv.id)}
                  onStatusChange={(statut) => handleStatusChange(rdv.id, statut)}
                />
              ))
            ) : (
              <div className="py-16 text-center">
                <Search className="mx-auto mb-3 size-6 text-muted-foreground" />
                <p className="font-medium">Aucun rendez-vous trouvé</p>
                <p className="mt-1 text-sm text-muted-foreground">Modifiez votre recherche ou le filtre sélectionné.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-4 text-xs text-muted-foreground md:px-6">
            <span>{visibleAppointments.length} rendez-vous affichés</span>
            <span>Synchronisé avec l’API rendez-vous</span>
          </div>
        </section>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Nouveau rendez-vous" : "Modifier le rendez-vous"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rdv-nom">Nom</Label>
              <Input
                id="rdv-nom"
                value={form["nom"]}
                onChange={(event) => setForm({ ...form, nom: event.target.value })}
                placeholder="Nom du visiteur"
                className="h-11 bg-muted/40 shadow-none"
              />
              {errors["nom"] && <p className="text-xs font-medium text-destructive">{errors["nom"]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rdv-date">Date</Label>
                <Input
                  id="rdv-date"
                  type="date"
                  value={form["date"]}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="h-11 bg-muted/40 shadow-none"
                />
                {errors["date"] && <p className="text-xs font-medium text-destructive">{errors["date"]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rdv-heure">Heure</Label>
                <Input
                  id="rdv-heure"
                  type="time"
                  value={form["heure"]}
                  onChange={(event) => setForm({ ...form, heure: event.target.value })}
                  className="h-11 bg-muted/40 shadow-none"
                />
                {errors["heure"] && <p className="text-xs font-medium text-destructive">{errors["heure"]}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-lieu">Lieu (optionnel)</Label>
              <Input
                id="rdv-lieu"
                value={form.lieu ?? ""}
                onChange={(event) => setForm({ ...form, lieu: event.target.value })}
                placeholder="Ex. Bureau DG, Salle de réunion…"
                className="h-11 bg-muted/40 shadow-none"
              />
            </div>
            {formError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                <X /> Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="shadow-brand">
                {submitting ? "Enregistrement…" : editingId === null ? "Créer" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function AppointmentRow({
  rdv,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  rdv: RendezVous;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (statut: StatutRdv) => void;
}) {
  return (
    <article className="grid gap-4 px-5 py-5 transition-colors hover:bg-muted/25 md:px-6 xl:grid-cols-[minmax(250px,1.35fr)_minmax(190px,.8fr)_minmax(160px,.7fr)_minmax(175px,.8fr)_auto] xl:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div className="avatar avatar-emerald">{initialsFor(rdv.nom)}</div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-card-foreground">{rdv.nom}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">{dateGroupLabel(rdv.date)}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 text-sm">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">{dateGroupLabel(rdv.date)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rdv.heure}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">{rdv.lieu || "Non précisé"}</span>
      </div>

      <div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[rdv.statut]}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {STATUT_LABELS[rdv.statut]}
        </span>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MessageCircleMore className="size-3.5 text-success" />
          {reminderLabel(rdv)}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="justify-self-end" aria-label={`Actions pour ${rdv.nom}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={onEdit}>Modifier</DropdownMenuItem>
          <DropdownMenuItem disabled={rdv.statut === "confirme"} onClick={() => onStatusChange("confirme")}>
            Marquer comme confirmé
          </DropdownMenuItem>
          <DropdownMenuItem disabled={rdv.statut === "termine"} onClick={() => onStatusChange("termine")}>
            Marquer comme terminé
          </DropdownMenuItem>
          <DropdownMenuItem disabled={rdv.statut === "reporte"} onClick={() => onStatusChange("reporte")}>
            Marquer comme reporté
          </DropdownMenuItem>
          <DropdownMenuItem disabled={rdv.statut === "manque"} onClick={() => onStatusChange("manque")}>
            Marquer comme manqué
          </DropdownMenuItem>
          <DropdownMenuItem disabled={rdv.statut === "annule"} onClick={() => onStatusChange("annule")}>
            Annuler ce rendez-vous
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
