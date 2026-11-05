# Agentic customer engagement, built three times

The same customer engagement system for one demo product, built on **Novu**, **Knock**, and **Courier**. It backs the Novu blog post *Novu vs Knock vs Courier: We built the same agentic customer engagement system three times*.

Clone it, add your own keys for any of the three platforms, ship a demo order on each, and compare the results side by side.

## What every tab does

The same `order-shipped` event and payload go to all three platforms.

| Step | What happens | Novu | Knock | Courier |
| --- | --- | --- | --- | --- |
| 1. Notify | AI writes a one-line personal message, then an in-app message is sent | Workflow in code, model call in your code | Dashboard workflow, hosted agent step | Dashboard Journey, AI node (Business plan) |
| 2. Escalate | Wait 2 minutes, email only if the in-app message is unread | `skip` on `inbox.read` | Message status condition | Send status condition `was not OPENED` (Inbox marks a message opened when it's shown, not when it's read) |
| 3. Reply | The customer asks a support agent about the order | Novu Connect Web Chat | No documented equivalent | No documented equivalent |

Step 4, an agent building the whole flow from a prompt, isn't part of the site. It's a recorded test; see `docs/TESTING.md`.

## Quick start

Requires Node.js 22 or later.

```bash
npm install
cp .env.example .env.local   # add your keys, see docs/SETUP.md
npm run dev                  # http://localhost:3000
```

You don't need all three accounts. Each tab works on its own, and a tab with missing keys shows "Not configured".

- **Novu:** also run `npm run novu:dev` in a second terminal and sync once (see `docs/SETUP.md`), so Novu Cloud can reach the workflow and agent code in this repo.
- **Knock and Courier:** the flows live in their dashboards, so you build them in your own account. `docs/SETUP.md` has the exact steps, copy, and the gotchas we hit.

Open `http://localhost:3000/?owner=<DEMO_OWNER_TOKEN>` to also send the 2-minute email fallback to `DEMO_EMAIL_TO`.

## Docs

- `docs/SETUP.md`: accounts, keys, and the dashboard setup for each platform.
- `docs/TESTING.md`: the test script, including the agent-builds-it prompts.
- `docs/SCORECARD.md`: where results are recorded for the article.

## Safety

- Secret keys are server-only. The browser gets only public keys and short-lived, per-user tokens or HMAC hashes.
- Each reader gets a random `demo-xxxxxxxxxx` user, and the API rejects any other ID.
- Email sends only in owner mode (`?owner=<DEMO_OWNER_TOKEN>`), and only to `DEMO_EMAIL_TO`.
- `.env.local` is git-ignored. Never commit your keys.
- Triggers are rate-limited per IP. The limiter is in memory, so swap in Redis or KV if you host it publicly.

## Disclosure

The Novu team built this. Knock and Courier are configured following their own docs, and every capability claim links to the page we checked. Corrections are welcome as issues or pull requests.
