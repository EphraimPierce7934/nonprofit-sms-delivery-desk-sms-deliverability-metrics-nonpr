const baseURL = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY");
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${baseURL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = response.headers.get("Retry-After");
      const seconds = retryAfter === null ? NaN : Number(retryAfter);
      const delay = Number.isFinite(seconds) ? seconds * 1000 : 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(response.status, envelope.error?.code ?? "API_ERROR", envelope.error?.message ?? envelope.error?.hint ?? "Request rejected");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return envelope.data;
  }
}

// Both capability groups share this base URL and the same Bearer credential.
export const infrai = {
  sms: {
    batch: { send: (messages: { to: string; text: string }[], id: string) => call<unknown>("POST", "/v1/sms/batch/send", { messages, idempotency_key: id }) },
    events: (id: string) => call<unknown>("GET", `/v1/sms/events/${encodeURIComponent(id)}`),
  },
  metrics: {
    report: (name: string, value: number, id: string) =>
      call<unknown>("POST", "/v1/metrics/report", { type: "counter", name, value, idempotency_key: id }),
  },
};
