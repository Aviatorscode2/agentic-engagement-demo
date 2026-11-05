# Project context for Claude Code

## What this is

A Next.js 15 (App Router) demo that builds the same customer engagement system three times, on **Novu**, **Knock**, and **Courier**. It backs a Novu blog post: *Novu vs Knock vs Courier: We built the same agentic customer engagement system three times*. It ships as a public GitHub repo: readers clone it, add their own credentials in `.env.local`, and run it locally. Hosting is optional, so keep setup docs (`docs/SETUP.md`) accurate for someone starting from empty accounts.

The author is on the Novu team. The comparison must stay fair: report what actually works, and where Knock or Courier win, say so.

## The three scenarios (identical on every tab)

1. **Notify:** an AI step writes a one-line personal message, then an in-app message is sent.
2. **Escalate:** wait 2 minutes, then email only if the in-app message is unread.
3. **Reply:** the customer chats with a support agent about the order. Only Novu (Connect / Web Chat) has this; the Knock and Courier panels show a dated "not available" notice with doc links.

Test 4 (an agent builds the flow from one prompt) is a manual procedure in `docs/TESTING.md`, not part of the site.

## Where things live

- `lib/order.ts`: the shared demo order payload (same for all vendors).
- `lib/server/vendors/{novu,knock,courier}.ts`: server-side trigger + per-user auth for each vendor.
- `app/api/session/route.ts`: returns per-user tokens/hashes for each vendor's in-app UI.
- `app/api/trigger/[vendor]/route.ts`: triggers the event, rate limits, owner-mode email.
- `app/api/novu/route.ts`: Novu bridge (`serve()` with the workflow and agent).
- `novu/workflows/order-shipped.ts`: Novu workflow in code (Framework).
- `novu/agents/support-agent.ts`: Novu Connect agent (AI SDK adapter, `getOrder` tool).
- `components/vendors/*Panel.tsx`: each vendor's UI (inbox + trigger + reply).
- `docs/SETUP.md`, `docs/TESTING.md`, `docs/SCORECARD.md`: setup, test script, results.

Knock and Courier workflows are built in their dashboards (see `docs/SETUP.md`), not in code.

## Rules

- **Secret keys stay server-side.** Never prefix a secret with `NEXT_PUBLIC_`, never send one to the browser, never commit `.env.local`.
- **Readers never trigger email.** Email only sends in owner mode (`?owner=<DEMO_OWNER_TOKEN>`) to `DEMO_EMAIL_TO`.
- **Subscriber IDs must match `^demo-[a-z0-9]{10}$`.** The API rejects anything else.
- **Same payload, same copy, same 2-minute delay** on all three vendors.
- **Verify SDK calls against current docs** before changing them. Vendor SDKs change often; don't guess method names.
- Keep a vendor's failure isolated: a missing key or error on one tab must not break the other two.

## Known state and likely problem spots

- `package.json` was fixed by hand: `ai` ^7, `@ai-sdk/openai` ^4, `zod` ^3.25.76 (required by `@novu/framework` 2.14).
- `zod-to-json-schema` is required: without it `@novu/framework` throws `MissingDependencyError` and the bridge returns 500.
- Courier journeys and their journey-scoped templates must each be published; `COURIER_JOURNEY_ID` is the journey's UUID.
- Courier AI node: prompt variables need the `data.` prefix (`{{data.item}}`), and the output lands under `ai_result`, so templates use `{{ai_result.line}}` (not `{{line}}` as the docs suggest). The API reports only `ERROR` for a failed AI step; the reason is only in the dashboard Logs view. It also needs a separate AI credit pack.
- Not yet verified against installed types:
  - Novu `<Inbox>` prop: the docs use both `subscriber` and `subscriberId`.
  - `stepCountIs` import and `tool({ inputSchema })` in `novu/agents/support-agent.ts` under AI SDK 7.
  - Courier `client.auth.issueToken` and `client.journeys.invoke` in the installed `@trycourier/courier` version.
  - Knock `KnockProvider` takes `user={{ id }}` (not `userId`).
- Novu's bridge needs `npm run novu:dev` running alongside `npm run dev` locally.
- Courier's email step uses a send status condition: `["send_status.<inbox send node id>", "was not", "OPENED"]`. Courier has no "read" status; Inbox sets OPENED as soon as the message is displayed, so the check is "not seen", not "not read". Verified 2026-10-21 (Run A emailed, Run B skipped).
- Courier's AI node needs the Business plan (the author upgraded to test it). Knock's agent step uses AI credits.

## Dashboard notes

- **Knock:** channels are under account settings > **Channels and sources**, not the sidebar. Keys are per environment; the demo runs in Development.
- **Courier:** create the journey with the **API Invoke** trigger.
- **Novu:** create a custom-code agent with identifier `parcelly-support` and add the Web Chat channel. (`support-agent` in this account is an unrelated managed Claude agent.)

## Writing rules (for any copy shown on the site)

No em dashes. Plain verbs, no hype. Use contractions. Date any claim about what a vendor can't do, and link the docs checked.
