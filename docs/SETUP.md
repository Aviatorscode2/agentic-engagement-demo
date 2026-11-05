# Setup

You run this demo locally with your own accounts. Each platform is optional: a tab with missing keys shows "Not configured" and the other two keep working.

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev                  # http://localhost:3000
```

Use the **same 2-minute delay** and the **same copy** on all three platforms so the comparison stays fair. The copy is listed in each section below.

**Demo controls.** `DEMO_OWNER_TOKEN` is a password you make up. Generate one with `openssl rand -hex 24`. Open `http://localhost:3000/?owner=<token>` to send the email fallback to `DEMO_EMAIL_TO`. Without it, every run skips email.

---

## Novu

The workflow (`novu/workflows/order-shipped.ts`) and the support agent (`novu/agents/support-agent.ts`) are code, so setup is mostly keys.

1. **Keys.** Dashboard > API Keys. Copy the Secret Key to `NOVU_SECRET_KEY` and the Application Identifier to `NEXT_PUBLIC_NOVU_APP_ID`.
2. **Model key.** Set `OPENAI_API_KEY`. It powers the personalization step and the support agent. Without it, the in-app message uses a fixed line.
3. **Agent.** Dashboard > Agents > Create agent > **Custom code**. Set the Identifier to `parcelly-support` (or whatever you put in `NEXT_PUBLIC_NOVU_AGENT_ID`). Add the **Web Chat** channel. Don't reuse a managed agent: it runs Novu's hosted model instead of your code, so it can't look up the order.
4. **Email provider (owner mode only).** The built-in "Novu Email" test provider only sends to the email of the logged-in Novu user. To send to any other `DEMO_EMAIL_TO`, go to Integrations, add your own provider (we used Resend with `onboarding@resend.dev`), and make it active and primary for email.
5. **Security (recommended).** Turn on HMAC for In-App and Web Chat. The app already sends `subscriberHash` and `agentHash`.
6. **Bridge.** Novu Cloud runs your code through a tunnel. With `npm run dev` running, start the tunnel in a second terminal:

   ```bash
   npm run novu:dev
   ```

   It prints a tunnel URL like `https://<id>.novu.sh/api/novu`. Keep it running, and in a third terminal sync the workflow and agent to it once:

   ```bash
   npx novu@latest sync --bridge-url https://<id>.novu.sh/api/novu --secret-key <NOVU_SECRET_KEY>
   ```

   The tunnel URL is stable for your machine and port, so you only sync again if you change the workflow, the agent identifier, or the port. If triggers fail with `workflow_not_found` or the run log shows `TunnelNotFound`, the sync is missing or points at an old tunnel.

---

## Knock

The workflow is built in the dashboard (or with the Knock CLI or MCP server). Do everything in the **Development** environment: keys are per environment.

1. **Keys.** Developers > API keys. Copy the Secret key to `KNOCK_API_KEY` and the Public key to `NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY`. Generate a Signing key and copy it to `KNOCK_SIGNING_KEY`.
2. **Enhanced security.** Turn it on for the environment, so the feed requires the signed user token the app sends.
3. **In-app feed channel.** Channels are in account settings, not the sidebar: click your account name (top left) > settings > **Channels and sources**. Copy the in-app feed channel's ID to `NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID`. Knock's built-in email channel covers owner-mode email, but only to members of your Knock account, so set `DEMO_EMAIL_TO` to a member's address or add your own provider.
4. **AI credits.** The agent step needs Knock AI credits. Without them the step fails with "Insufficient AI credits" and the workflow stops before the in-app step.
5. **Workflow** with the key `order-shipped` (matching `KNOCK_WORKFLOW_KEY`):
   1. **Agent step**, ref `personalize`, response type JSON with a `response_text` string field. Prompt:
      `Write one friendly sentence (max 20 words) telling {{ recipient.name }} that their {{ data.item }} shipped with {{ data.carrier }} and arrives {{ data.estimatedDelivery }}. No emoji, no greeting.`
   2. **In-app feed step.** Replace the default template. Body:
      ```
      **Order {{ data.orderId }} has shipped**

      {{ data.personalize.response_text }}
      ```
      Action URL: `{{ data.trackingUrl }}`.
   3. **Delay step**, 2 minutes.
   4. **Email step.** Subject `Your order {{ data.orderId }} has shipped`. Body:
      ```html
      <p>Hi {{ data.customerName }},</p><p>{{ data.personalize.response_text }}</p><p>Tracking: <a href="{{ data.trackingUrl }}">{{ data.trackingNumber }}</a> ({{ data.carrier }})</p>
      ```
      Add a step condition on **message status**: the in-app step **has not been read**. (Don't use a data condition like `data.read`; that checks the trigger payload, not the message.)
   5. **Commit** the workflow. Uncommitted changes don't run.

Docs: [Agent function](https://docs.knock.app/designing-workflows/ai-agent-function), [Step conditions](https://docs.knock.app/concepts/conditions).

---

## Courier

The flow is a Journey built in the dashboard (or with the Courier MCP server).

1. **Key.** Settings > API Keys. Copy the workspace key to `COURIER_API_KEY`.
2. **Plan and credits.** The AI node needs the Business or Enterprise plan **and** a separately purchased AI credit pack. Without credits the AI step fails and stops the run, and the API reports only `ERROR`; the reason shows in the journey's Logs view.
3. **Email provider.** Integrations > add one (we used Resend). With Resend's test sender, set the From address to `onboarding@resend.dev`; it only delivers to your Resend account's email, so use that as `DEMO_EMAIL_TO`. Any other unverified From domain fails with a 403.
4. **Journey.** Journeys > Add journey, **API Invoke** trigger. Copy the journey's ID (the UUID in the editor header) to `COURIER_JOURNEY_ID`. Then add, in order:
   1. **AI node.** Output schema with one string field, `line`. Prompt (note the `data.` prefix, without it the model receives the raw placeholders):
      `Write one friendly sentence (max 20 words) telling {{data.customerName}} that their {{data.item}} shipped with {{data.carrier}} and arrives {{data.estimatedDelivery}}. No emoji, no greeting.`
   2. **Send node, Inbox.** Title `Order {{orderId}} has shipped`, body `{{ai_result.line}}`, button "Track package" linking to `{{trackingUrl}}`. The AI output is stored under `ai_result`, so `{{line}}` renders empty.
   3. **Delay node**, 2 minutes.
   4. **Send node, Email.** Subject `Your order {{orderId}} has shipped`. Body: `Hi {{customerName}},`, then `{{ai_result.line}}`, then `Tracking: {{trackingNumber}} ({{carrier}})` and a "Track package" button.
5. **Publish.** Publish the journey **and** each message template inside it. An unpublished template fails at send time with "Notification template not found".
6. **Email only if not opened.** On the email send node, add a step condition on the Inbox node's send status: **was not OPENED** (in the API: `["send_status.<inbox node id>", "was not", "OPENED"]`). Courier has no "read" status, and the Inbox marks a message opened as soon as it's displayed, so this skips the email once the customer has seen the message, even if they never mark it read.

Docs: [Journeys](https://www.courier.com/docs/platform/journeys/journeys-overview), [AI node](https://www.courier.com/docs/journeys/nodes/ai), [Invoke a journey](https://www.courier.com/docs/api-reference/journeys/invoke-a-journey), [Inbox authentication](https://www.courier.com/docs/platform/inbox/authentication).

---

## Optional: deploy

The app runs on any Node.js host. On Vercel, add every variable from `.env.example` under Project Settings > Environment Variables, deploy, then point Novu at the deployed bridge instead of the tunnel:

```bash
BRIDGE_URL=https://<your-domain>/api/novu NOVU_SECRET_KEY=<secret> npm run novu:sync
```

The trigger rate limiter is in memory, so use Redis or KV before sharing a public URL widely.
