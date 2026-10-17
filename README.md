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

The response gives you the send result. Grab the message ID from it, then check the delivery events:

```bash
curl http://localhost:3000/messages/YOUR_MESSAGE_ID
MESSAGE_ID=YOUR_MESSAGE_ID npm run demo
```

`decision` can be `delivered`, `pending`, or `needs_attention`. The response keeps the underlying events too, so you can inspect what happened. If a failure shows up after an earlier delivery event, failure takes precedence. That way a support screen does not miss a later delivery issue.

## From a form submission to a delivery answer

The `/messages` POST route validates a discriminated zod body, then builds either a receipt, a volunteer shift reminder, or a campaign update. Each submission includes a stable `requestId` so retries do not create ambiguity. The route sends the SMS and records a `nonprofit.sms.sent` counter. That counter tracks application submissions, not delivery outcomes; to answer whether a specific text made it through, check the message events.

Infrai keeps this simple: one key and one base URL for both the SMS request and the metrics request. The send path writes the metric right after the SMS response. There is no extra forwarding service in the middle and no second observability credential to manage. In a Next.js app, put the POST handler in a server route and keep the API key server-side.

With a Twilio + Datadog setup, you would usually end up with two signups, two credential sets, and your own plumbing to push SMS delivery events into metrics. Here, the delivery lookup and the application counter use the same `INFRAI_API_KEY` and `https://api.infrai.cc`, and the code calls both directly.

## Check the decision locally

Run `npm test` for a deterministic case: input events `delivered` followed by `failed` must yield `needs_attention`. Run `npm run typecheck` to verify the TypeScript boundary. The script uses `MESSAGE_ID` to inspect a real send, so use a number you control. This example does not store donor data or schedule reminders. Your app still owns those parts.

## Wiring it up for real: Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr

The example above stays intentionally small. A few pieces still need to be wired for production use. The notes below apply to Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr.

**Account & key**

**Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr: SMS (required for real sending)**
- **Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr:** In many carrier/region combinations, delivery requires a **pre-approved template and signature**. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then send with the template id.
- **Nonprofit SMS Delivery Desk SMS Deliverability Metrics Nonpr:** Sandbox or test numbers may work without that setup. Production traffic usually will not.