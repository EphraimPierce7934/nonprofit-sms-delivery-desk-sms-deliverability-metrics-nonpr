import { createServer } from "node:http";
import { z } from "zod";
import { deliveryDecision } from "./delivery_decision.ts";
import { infrai, InfraiError } from "./infrai.ts";

const requestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("receipt"), requestId: z.string().min(1), to: z.string().min(1), donor: z.string().min(1), amount: z.string().min(1) }),
  z.object({ kind: z.literal("volunteer_reminder"), requestId: z.string().min(1), to: z.string().min(1), shift: z.string().min(1) }),
  z.object({ kind: z.literal("campaign_report"), requestId: z.string().min(1), to: z.string().min(1), campaign: z.string().min(1), total: z.string().min(1) }),
]);

function message(input: z.infer<typeof requestSchema>): string {
  switch (input.kind) {
    case "receipt": return `Thank you ${input.donor}. We received your ${input.amount} donation.`;
    case "volunteer_reminder": return `Reminder: your volunteer shift is ${input.shift}. Thank you!`;
    case "campaign_report": return `${input.campaign} update: ${input.total} raised. Thank you for supporting us.`;
  }
}

export const server = createServer(async (request, response) => {
  const reply = (status: number, data: unknown) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  };
  try {
    if (request.method === "POST" && request.url === "/messages") {
      let raw = "";
      for await (const chunk of request) raw += chunk;
      const parsed = requestSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return reply(400, { error: parsed.error.flatten() });
      const input = parsed.data;
      const sent = await infrai.sms.batch.send([{ to: input.to, text: message(input) }], input.requestId);
      await infrai.metrics.report("nonprofit.sms.sent", 1, `${input.requestId}:sent`);
      return reply(202, { kind: input.kind, sent });
    }
    if (request.method === "GET" && request.url?.startsWith("/messages/")) {
      const id = decodeURIComponent(request.url.slice("/messages/".length));
      if (!id || id.includes("/")) return reply(400, { error: "Invalid message ID" });
      const result = await infrai.sms.events(id);
      const events = Array.isArray(result) ? result : (result as { events?: unknown[] }).events ?? [];
      const decision = deliveryDecision(events as { type?: string; status?: string }[]);
      return reply(200, { messageId: id, decision, events });
    }
    return reply(404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof SyntaxError) return reply(400, { error: "Invalid JSON" });
    if (error instanceof InfraiError) return reply(error.status >= 400 && error.status < 500 ? error.status : 502, { error: error.code, message: error.message });
    return reply(502, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});

if (process.env.NODE_ENV !== "test") server.listen(Number(process.env.PORT ?? 3000), () => console.log(`Delivery desk listening on ${process.env.PORT ?? 3000}`));
