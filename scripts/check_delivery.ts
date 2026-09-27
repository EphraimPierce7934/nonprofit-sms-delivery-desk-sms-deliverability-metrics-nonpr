import { infrai } from "../src/infrai.ts";
import { deliveryDecision } from "../src/delivery_decision.ts";

const id = process.env.MESSAGE_ID;
if (!id) throw new Error("Set MESSAGE_ID to the message ID from your send response");
const result = await infrai.sms.events(id);
const events = Array.isArray(result) ? result : (result as { events?: unknown[] }).events ?? [];
console.log(JSON.stringify({ messageId: id, decision: deliveryDecision(events as { type?: string; status?: string }[]), events }, null, 2));
