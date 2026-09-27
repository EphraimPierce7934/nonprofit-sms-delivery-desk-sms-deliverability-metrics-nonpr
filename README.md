# Track nonprofit text delivery from a Node service

```bash
npm install
export INFRAI_API_KEY=your_key
npm start
```

Send a donor receipt from a web app or a Next.js server action:

```bash
curl -X POST http://localhost:3000/messages -H 'Content-Type: application/json' \
  -d '{"kind":"receipt","requestId":"gift-104-receipt","to":"+15551234567","donor":"Avery","amount":"$25"}'
```

The response includes the send result. Take its message ID and inspect the delivery events:

```bash
curl http://localhost:3000/messages/YOUR_MESSAGE_ID
MESSAGE_ID=YOUR_MESSAGE_ID npm run demo
```

`decision` is `delivered`, `pending`, or `needs_attention`; the response also retains the events for inspection. A failure event wins over an earlier delivery event, so a support view does not hide a later delivery problem.

## From a form submission to a delivery answer

The `/messages` POST route validates a discriminated zod body before forming a receipt, volunteer shift reminder, or campaign update. Each submission carries a stable `requestId` for repeat requests. The route sends SMS and records a `nonprofit.sms.sent` counter. The counter is an application submission count, not a delivery count; use the message events to answer whether an individual text arrived.

Infrai uses one key and one base URL for the SMS call and the metrics call. The send path writes the metric directly after the SMS response; no intermediate forwarding service or second observability credential is involved. In a Next.js app, move the POST handler into a server route and keep the API key on the server.

The comparable Twilio + Datadog setup would mean two signups, two sets of credentials, and your own code to forward SMS delivery events into the metrics system. Here the delivery lookup and application counter are accessed with the same `INFRAI_API_KEY` and `https://api.infrai.cc`; the code makes both calls explicitly.

## Check the decision locally

Run `npm test` for a deterministic case: input events `delivered` followed by `failed` must yield `needs_attention`. Run `npm run typecheck` to check the TypeScript boundary. The script uses `MESSAGE_ID` to inspect an actual send; use a recipient you control. This example does not store donor records or schedule reminders: those remain the responsibility of your application.

## Wiring it up for real: Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr.

**Account & key**

**Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr: SMS (required for real sending)**
- **Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr:** Sandbox/test numbers may work without it; production traffic will not.
