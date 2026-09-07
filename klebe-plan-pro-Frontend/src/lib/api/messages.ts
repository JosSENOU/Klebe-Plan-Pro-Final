import { apiFetch, mockDelay, unwrap, USE_MOCK } from "./client";

export type MessageType = "veille" | "jour_j" | "15min";

export type MessageTemplate = {
  template: string;
  personnalise: boolean;
};

export type MessagesSummary = Record<MessageType, MessageTemplate>;

// Doit rester cohérent avec Entreprise::TEMPLATES_DEFAUT côté backend.
const defaults: MessagesSummary = {
  veille: { template: 'Rappel : rendez-vous "{nom}" demain à {heure} ({lieu}).', personnalise: false },
  jour_j: { template: 'Rappel : rendez-vous "{nom}" aujourd\'hui à {heure} ({lieu}).', personnalise: false },
  "15min": { template: 'Rappel : rendez-vous "{nom}" dans 15 minutes à {heure} ({lieu}).', personnalise: false },
};

let mockMessages: MessagesSummary = { ...defaults };

export async function getMessages(): Promise<MessagesSummary> {
  if (USE_MOCK) {
    await mockDelay();
    return { ...mockMessages };
  }
  const body = await apiFetch<{ data: MessagesSummary }>("/api/messages");
  return unwrap(body);
}

export async function updateMessages(input: Partial<Record<MessageType, string>>): Promise<MessagesSummary> {
  if (USE_MOCK) {
    await mockDelay();
    for (const key of Object.keys(input) as MessageType[]) {
      const value = input[key];
      if (value !== undefined) {
        mockMessages = { ...mockMessages, [key]: { template: value, personnalise: true } };
      }
    }
    return { ...mockMessages };
  }
  const payload: Record<string, string> = {};
  if (input.veille !== undefined) payload["message_veille"] = input.veille;
  if (input.jour_j !== undefined) payload["message_jour_j"] = input.jour_j;
  if (input["15min"] !== undefined) payload["message_15min"] = input["15min"];

  const body = await apiFetch<{ data: MessagesSummary }>("/api/messages", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return unwrap(body);
}
