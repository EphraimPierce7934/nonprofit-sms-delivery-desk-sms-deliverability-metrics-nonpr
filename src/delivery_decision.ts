export type MessageKind = "receipt" | "volunteer_reminder" | "campaign_report";

export function deliveryDecision(events: { type?: string; status?: string }[]): "delivered" | "needs_attention" | "pending" {
  const labels = events.map((event) => (event.status ?? event.type ?? "").toLowerCase());
  if (labels.some((label) => ["failed", "undelivered", "rejected"].includes(label))) return "needs_attention";
  if (labels.includes("delivered")) return "delivered";
  return "pending";
}
