import React, { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Clock, MapPin, Calendar as CalendarIcon, User } from "lucide-react";

/**
 * FORMULAIRE RDV — Klébé Plan Pro
 * Rôle : Shalom (Front-end)
 * Statut : ARCHIVÉ le 03/09/2026 (Claude) — NON utilisé par le routeur.
 *
 * ─────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EST ARCHIVÉ
 * Ce composant était posé à la racine du repo (hors de `src/routes/`),
 * donc invisible pour le routeur TanStack basé sur les fichiers. Son
 * code métier (CRUD rendez-vous, branché sur l'API réelle) a été repris
 * et intégré au vrai tableau de bord de production : `src/routes/index.tsx`,
 * qui utilise l'AppShell + les composants shadcn/Tailwind du reste de
 * l'application (au lieu des styles inline ci-dessous) et le client API
 * partagé `src/lib/api/rendezvous.ts`.
 *
 * Ce fichier est conservé ici comme référence/historique du travail de
 * Shalom mais ne doit PAS être remonté dans `src/routes/` tel quel : cela
 * créerait une page en doublon/conflit avec `/` (le dashboard réel).
 * Si son style visuel (cartes, palette #3B5249/#F7F5EF) doit être repris,
 * le faire en adaptant `src/routes/index.tsx`, pas en réactivant ce fichier.
 * ─────────────────────────────────────────────────────────
 *
 * NOTES DE BRANCHEMENT D'ORIGINE (Shalom)
 * - Base URL : http://127.0.0.1:8000/api (à changer en prod / si le port change)
 * - Auth : Bearer token Sanctum, lu depuis localStorage("token").
 *   Dès que Keira a fini la page de connexion, vérifie que la clé
 *   utilisée pour stocker le token est bien "token" (sinon ajuste
 *   TOKEN_STORAGE_KEY ci-dessous).
 * - "lieu" n'est PAS obligatoire côté backend (nullable) → validation
 *   front alignée là-dessus, contrairement à la fiche de tâche initiale.
 * - Le backend renvoie tout dans { data: ... } → on déballe à chaque appel.
 * ─────────────────────────────────────────────────────────
 */

const BASE_URL = "http://127.0.0.1:8000/api";
const TOKEN_STORAGE_KEY = "token";

const STATUT_LABELS = {
  planifie: "Planifié",
  confirme: "Confirmé",
  reporte: "Reporté",
  annule: "Annulé",
  manque: "Manqué",
  termine: "Terminé",
};

function authHeaders() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Laravel renvoie les erreurs de validation dans body.errors
    const message = body.message || "Une erreur est survenue.";
    const err = new Error(message);
    err.fields = body.errors || {};
    throw err;
  }
  return body;
}

const api = {
  list: async () => {
    const res = await fetch(`${BASE_URL}/rendez-vous`, { headers: authHeaders() });
    const body = await handleResponse(res);
    return body.data; // tableau de RDV
  },
  create: async (payload) => {
    const res = await fetch(`${BASE_URL}/rendez-vous`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const body = await handleResponse(res);
    return body.data;
  },
  update: async (id, payload) => {
    const res = await fetch(`${BASE_URL}/rendez-vous/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const body = await handleResponse(res);
    return body.data;
  },
  remove: async (id) => {
    const res = await fetch(`${BASE_URL}/rendez-vous/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await handleResponse(res);
    return { id };
  },
};

const emptyForm = { nom: "", date: "", heure: "", lieu: "" };

function validate(form) {
  const errors = {};
  if (!form.nom.trim()) errors.nom = "Le nom est requis.";
  if (!form.date) {
    errors.date = "La date est requise.";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(form.date + "T00:00:00");
    if (chosen < today) errors.date = "La date ne peut pas être dans le passé.";
  }
  if (!form.heure) errors.heure = "L'heure est requise.";
  // "lieu" est facultatif côté backend (nullable) — pas de validation requise ici.
  return errors;
}

export default function FormulaireRDV() {
  const [rdvs, setRdvs] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [mode, setMode] = useState(null); // null | "create" | "edit" | "delete"
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  React.useEffect(() => {
    loadRdvs();
  }, []);

  async function loadRdvs() {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const data = await api.list();
      setRdvs(data);
    } catch (err) {
      setLoadError(err.message || "Impossible de charger les rendez-vous.");
    } finally {
      setInitialLoading(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setMode("create");
  }

  function openEdit(rdv) {
    setForm({ nom: rdv.nom, date: rdv.date, heure: rdv.heure, lieu: rdv.lieu });
    setErrors({});
    setActiveId(rdv.id);
    setMode("edit");
  }

  function openDelete(rdv) {
    setActiveId(rdv.id);
    setMode("delete");
  }

  function closeModal() {
    setMode(null);
    setActiveId(null);
    setForm(emptyForm);
    setErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      if (mode === "create") {
        const created = await api.create(form);
        setRdvs((prev) => [...prev, created]);
        showToast("Rendez-vous créé.");
      } else if (mode === "edit") {
        const updated = await api.update(activeId, form);
        setRdvs((prev) => prev.map((r) => (r.id === activeId ? updated : r)));
        showToast("Rendez-vous modifié.");
      }
      closeModal();
    } catch (err) {
      // Le backend renvoie err.fields = { nom: [...], date: [...] } si erreurs de validation
      if (err.fields && Object.keys(err.fields).length > 0) {
        const backendErrors = {};
        for (const key in err.fields) backendErrors[key] = err.fields[key][0];
        setErrors(backendErrors);
      } else {
        showToast(err.message || "Une erreur est survenue. Réessaie.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await api.remove(activeId);
      setRdvs((prev) => prev.filter((r) => r.id !== activeId));
      showToast("Rendez-vous supprimé.");
      closeModal();
    } catch (err) {
      showToast(err.message || "Suppression impossible. Réessaie.", "error");
    } finally {
      setLoading(false);
    }
  }

  const activeRdv = rdvs.find((r) => r.id === activeId);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Klébé Plan Pro · Module Rendez-vous</p>
            <h1 style={styles.title}>Rendez-vous du DG</h1>
          </div>
          <button style={styles.primaryBtn} onClick={openCreate}>
            <Plus size={18} strokeWidth={2.5} />
            Nouveau rendez-vous
          </button>
        </header>

        {initialLoading ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>Chargement des rendez-vous...</p>
          </div>
        ) : loadError ? (
          <div style={styles.empty}>
            <p style={{ ...styles.emptyText, color: "#B4442E" }}>{loadError}</p>
            <button style={styles.secondaryBtn} onClick={loadRdvs}>
              Réessayer
            </button>
          </div>
        ) : rdvs.length === 0 ? (
          <div style={styles.empty}>
            <CalendarIcon size={28} color="#8A8578" />
            <p style={styles.emptyText}>Aucun rendez-vous pour le moment.</p>
            <p style={styles.emptySub}>Crée le premier rendez-vous pour commencer.</p>
          </div>
        ) : (
          <ul style={styles.list}>
            {rdvs.map((rdv) => (
              <li key={rdv.id} style={styles.card}>
                <div style={styles.cardMain}>
                  <div style={styles.cardIcon}>
                    <User size={16} color="#3B5249" />
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.nameRow}>
                      <p style={styles.cardName}>{rdv.nom}</p>
                      {rdv.statut && (
                        <span style={styles.badge}>{STATUT_LABELS[rdv.statut] || rdv.statut}</span>
                      )}
                    </div>
                    <div style={styles.cardMeta}>
                      <span style={styles.metaItem}>
                        <CalendarIcon size={13} /> {formatDate(rdv.date)}
                      </span>
                      <span style={styles.metaItem}>
                        <Clock size={13} /> {rdv.heure}
                      </span>
                      {rdv.lieu && (
                        <span style={styles.metaItem}>
                          <MapPin size={13} /> {rdv.lieu}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.iconBtn} onClick={() => openEdit(rdv)} aria-label="Modifier">
                    <Pencil size={15} />
                  </button>
                  <button style={{ ...styles.iconBtn, color: "#B4442E" }} onClick={() => openDelete(rdv)} aria-label="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* MODAL — Création / Modification */}
      {(mode === "create" || mode === "edit") && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {mode === "create" ? "Nouveau rendez-vous" : "Modifier le rendez-vous"}
              </h2>
              <button style={styles.closeBtn} onClick={closeModal} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <Field label="Nom" error={errors.nom}>
                <input
                  style={inputStyle(errors.nom)}
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Nom du visiteur"
                />
              </Field>

              <div style={styles.row}>
                <Field label="Date" error={errors.date}>
                  <input
                    type="date"
                    style={inputStyle(errors.date)}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </Field>
                <Field label="Heure" error={errors.heure}>
                  <input
                    type="time"
                    style={inputStyle(errors.heure)}
                    value={form.heure}
                    onChange={(e) => setForm({ ...form, heure: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Lieu (optionnel)" error={errors.lieu}>
                <input
                  style={inputStyle(errors.lieu)}
                  value={form.lieu}
                  onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                  placeholder="Ex : Bureau DG, Salle de réunion..."
                />
              </Field>

              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryBtn} onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={loading}>
                  {loading ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL — Confirmation suppression */}
      {mode === "delete" && activeRdv && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Supprimer ce rendez-vous ?</h2>
            <p style={styles.confirmText}>
              Le rendez-vous avec <strong>{activeRdv.nom}</strong> du {formatDate(activeRdv.date)} à{" "}
              {activeRdv.heure} sera supprimé définitivement.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={closeModal}>
                Annuler
              </button>
              <button style={styles.dangerBtn} onClick={handleDelete} disabled={loading}>
                {loading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#B4442E" : "#3B5249" }}>
          <Check size={15} />
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <span style={styles.error}>{error}</span>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    ...styles.input,
    borderColor: hasError ? "#B4442E" : "#DDD8CC",
  };
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ---- Styles ----
const styles = {
  page: {
    minHeight: "100vh",
    background: "#F7F5EF",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "32px 20px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 640, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8A8578",
    fontWeight: 600,
  },
  title: { margin: "4px 0 0", fontSize: 26, fontWeight: 700, color: "#242220", letterSpacing: "-0.02em" },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#3B5249",
    color: "#F7F5EF",
    border: "none",
    borderRadius: 10,
    padding: "11px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    background: "transparent",
    color: "#5A564C",
    border: "1px solid #DDD8CC",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerBtn: {
    background: "#B4442E",
    color: "#FFF",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#FFFFFF",
    border: "1px solid #E9E5D9",
    borderRadius: 14,
    padding: "14px 16px",
    gap: 12,
  },
  cardMain: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#EAF0EC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardInfo: { minWidth: 0, flex: 1 },
  nameRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardName: { margin: 0, fontSize: 15, fontWeight: 600, color: "#242220" },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#3B5249",
    background: "#EAF0EC",
    padding: "2px 8px",
    borderRadius: 999,
  },
  cardMeta: { display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" },
  metaItem: { display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#8A8578" },
  cardActions: { display: "flex", gap: 6, flexShrink: 0 },
  iconBtn: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #E9E5D9",
    background: "#FFF",
    borderRadius: 8,
    cursor: "pointer",
    color: "#5A564C",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    border: "1px dashed #DDD8CC",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  emptyText: { margin: "8px 0 0", fontWeight: 600, color: "#242220" },
  emptySub: { margin: 0, fontSize: 13, color: "#8A8578" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(36,34,32,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    background: "#FFF",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalSmall: {
    background: "#FFF",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#242220" },
  closeBtn: {
    border: "none",
    background: "#F2EFE6",
    borderRadius: 8,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#5A564C",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "flex", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#5A564C" },
  input: {
    border: "1px solid #DDD8CC",
    borderRadius: 9,
    padding: "9px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    color: "#242220",
    outline: "none",
    boxSizing: "border-box",
  },
  error: { fontSize: 12, color: "#B4442E" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 },
  confirmText: { fontSize: 14, color: "#5A564C", lineHeight: 1.5 },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#FFF",
    padding: "11px 18px",
    borderRadius: 10,
    fontSize: 13.5,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
};
