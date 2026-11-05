# Scorecard

Results from building and running this demo. The article's comparison table comes from here, so it records what happened, not what the docs promise. "Not tested" and "not recorded" mean exactly that: don't fill those cells from docs or memory.

Tested on: 2026-10-18 · Plans used: Novu free tier (per API response headers) · Knock: plan not recorded, AI credits bought · Courier Business, plus a 2,000-credit AI pack

Environments: Novu Development, Knock Development, Courier production workspace ("Demo"). All runs were local (`npm run dev`), with Novu reached through `npm run novu:dev`.

## Setup

| | Novu | Knock | Courier |
| --- | --- | --- | --- |
| Time to first in-app message (sign-up to message) | Not recorded | Not recorded | Not recorded |
| Where the workflow lives | Code (`novu/workflows/order-shipped.ts`), synced to Novu Cloud | Dashboard. We fixed it through the Knock MCP server (Management API) | Dashboard. We fixed it through the Courier MCP server and API |
| Lines of app code (non-blank, non-comment) | 137 in `lib/server/vendors/novu.ts` + `NovuPanel.tsx` (the panel includes the step 3 chat UI), plus 107 for the workflow, agent, and bridge route | 111 in `lib/server/vendors/knock.ts` + `KnockPanel.tsx` | 93 in `lib/server/vendors/courier.ts` + `CourierPanel.tsx` |
| Dashboard or account steps needed | Keys; create a custom-code agent and add Web Chat; one `novu sync` to the local tunnel | Keys and signing key; feed channel ID; buy AI credits; build the workflow; commit | Keys; upgrade to Business; buy an AI credit pack; add an email provider (Resend); build the journey; publish the journey and each template separately |

## Test 1: Notify and escalate

| | Novu | Knock | Courier |
| --- | --- | --- | --- |
| Trigger API time (ms) | 561 to 785 (2 runs) | 721 to 817 (2 runs) | 574 to 1,409 without email (3 runs); 1,401 to 4,285 in owner mode (4 runs) |
| In-app message appears (seconds) | Not timed. Message status "sent" within about 12 s of trigger | Not timed. Message "delivered" within 15 s | Not timed. Inbox message "SENT" within about 20 s |
| Run A: email sent when unread | Pass, after connecting Resend (the built-in test provider only sends to the logged-in Novu user). Email "Message sent" via Resend after the delay | Pass (2026-10-21). Condition evaluated with no engagement, email delivered through Knock's built-in channel | Pass (2026-10-21). Message never displayed, email sent via Resend after the delay |
| Run B: email skipped when read | Pass (2026-10-21). Message clicked in the Inbox (marks it read); the `skip` on `inbox.read` returned true, email step "Bridge execution skipped" | Pass (2026-10-21). Feed "Mark all as read"; condition evaluated with `["read"]`, email step `skipped: conditions_not_met` | Pass, with a different meaning (2026-10-21). Message displayed in the Inbox, Courier marked it OPENED, email skipped. Courier has no "read" status, so this checks "not seen", not "not read" |
| Workarounds needed | None in the workflow | Replaced the dashboard-built email condition, which checked `data.read` (a payload field, never set) instead of read status | None. Send status condition on the email node: `["send_status.<inbox node id>", "was not", "OPENED"]`. We first documented this as impossible; the condition exists in the journey editor |

## Test 2: AI step in the workflow

| | Novu | Knock | Courier |
| --- | --- | --- | --- |
| Available on the plan we used | Yes. The model call is your code, with your own OpenAI key | Yes, after buying AI credits. Before that, the step failed with "Insufficient AI credits available" and the workflow stopped | Yes, after upgrading to Business and buying a separate AI credit pack. Before credits, the step returned `ERROR` and the run stopped |
| Where the model runs | Your code (`step.custom`, AI SDK) | Knock-hosted agent step | Courier-hosted AI node |
| Model | `gpt-4o-mini` via your OpenAI key | `anthropic:claude-haiku-4-5` | GPT-5.4 Mini (`gpt-5.4-mini`) |
| Cost | Not recorded (your OpenAI bill) | Not recorded (Knock AI credits) | Not recorded. Docs: 100 credits per $1, priced by model |
| Prompt and output visible in logs | Not checked in the Novu dashboard. The output is persisted as the step result and reused on retries | Yes, through the API: run events include the request prompt and model, and the message data includes the output (`data.personalize.response_text`) | Dashboard only. The journey Logs view shows the output and context. The API reports only `PROCESSED` or `ERROR`, with no output or error reason |
| Example output | "Your Trailhead 28L backpack has shipped via DHL Express and will arrive on Thursday between 2 to 4 pm." | "Your Trailhead 28L backpack is on its way via DHL Express and will arrive Thursday between 2 and 4 pm." | "Sam, your Trailhead 28L backpack shipped with DHL Express and arrives Thursday, 2 to 4 pm." |

## Test 3: The customer replies

| | Novu | Knock | Courier |
| --- | --- | --- | --- |
| Customer can reply to an agent | Yes. Web Chat to a custom-code agent ("Where is my order?" answered with the item, carrier, tracking link, and delivery window from the `getOrder` tool) | No documented way found (checked October 2026) | No documented way found (checked October 2026) |
| Channels for replies | Tested: Web Chat. Docs also list email, Slack, Microsoft Teams, WhatsApp, Telegram | n/a | n/a |
| Agent sees the original notification | Not tested. Per Novu docs, workflow-origin context applies to reply channels like email and Slack, not Web Chat | n/a | n/a |
| Reply latency (seconds) | Not timed | n/a | n/a |

## Test 4: An agent builds it

Not run yet. The prompt is in `docs/TESTING.md`.

| | Novu | Knock | Courier |
| --- | --- | --- | --- |
| MCP or CLI used | | | |
| Time to a working flow | | | |
| Follow-up prompts needed | | | |
| Manual fixes | | | |
| What it couldn't do | | | |

Related observation, not Test 4 itself: we used the Knock and Courier MCP servers to repair the existing flows. Both worked for reading and writing workflow and journey definitions. Courier's MCP returned 502 errors while the journey draft held an incomplete AI node (missing prompt and output schema). The REST API failed the same way, and that only affected reading that draft.

## Other rows for the article

Not researched yet. Check vendor pricing pages before filling these in.

| | Novu | Knock | Courier |
| --- | --- | --- | --- |
| Open source / self-host | | | |
| Pricing unit | | | |
| Free tier limit | | | |
| Where each one clearly wins | | | |

## Notes and surprises

Every problem we hit, per vendor, including Novu's. All of them came from getting this demo running on 2026-10-18.

### Novu

- `@novu/framework` 2.14 needed `zod-to-json-schema`, which npm didn't install with it. Without it the bridge returned 500 (`MissingDependencyError`). Also needed AI SDK 7 (`ai` ^7, `@ai-sdk/openai` ^4) to satisfy `@novu/framework`'s peer dependency.
- Running `npm run novu:dev` alone wasn't enough. Triggers failed with `workflow_not_found` until we ran `novu sync` against the tunnel URL. Pointing at a stale tunnel showed as `TunnelNotFound` in the run log.
- The account already had an agent called `support-agent`, but it was a managed agent (hosted Claude). It would have ignored the code agent. We created a separate custom-code agent, `parcelly-support`, through the API.
- The built-in "Novu Email" test provider only sends to the logged-in Novu user's address. Owner-mode email to any other address failed with "Test provider can only be used to send emails to current logged in user" until we connected our own provider (Resend).
- Web Chat replies arrive as Markdown, including an appended "Powered by Novu" link. Our custom chat UI had to render Markdown (we added `react-markdown`).

### Knock

- The AI agent step needs purchased AI credits. Without them it fails and stops the workflow before the in-app step.
- A new workflow's in-app step keeps Knock's placeholder copy ("there's a new activity in your workspace") until you replace it. The AI output path is `data.personalize.response_text`.
- The email step's condition, as first built in the dashboard, checked `data.read` from the trigger payload. That never reflects whether the message was read. The correct form is a message-status condition on the in-app step ref.
- Keys, channels, and workflows are per environment. Channels live under account settings > Channels and sources, not the sidebar.

### Courier

- The AI node needs the Business plan **and** a separately purchased AI credit pack. On the Developer plan it shows "Upgrade to use AI in Journeys". With Business but no credits, the step fails and stops the run.
- When the AI step fails, the API and MCP report only `ERROR`, with no reason. The reason is only in the dashboard's journey Logs view.
- Docs say templates reference AI output by field name (`{{line}}`). In practice the output is stored under `ai_result`, so templates need `{{ai_result.line}}`. Prompt variables also need the `data.` prefix (`{{data.item}}`). With `{{item}}` the model received the raw placeholders and wrote a generic line.
- The API's `user_prompt` field doesn't appear in the dashboard's "Instructions" field. That's a separate, optional field.
- The model field accepts any string, and the docs list display names only, not API IDs.
- The journey is invoked by its UUID. Using its name failed with "Automation template order-shipped not found".
- The journey and every message template inside it must each be published. An unpublished template fails at send time with "Notification template not found".
- Email needs your own provider. We used Resend, whose test sender (`onboarding@resend.dev`) only delivers to the Resend account's own address. Other unverified From domains failed with 403.
- "Email only if unread" maps to a send status condition on the email node (`was not OPENED` on the Inbox node). Courier's message statuses have no "read" value, and the Inbox sets OPENED as soon as a message is displayed, so the email is skipped once the customer has seen the message, whether or not they mark it read. On this demo, where the inbox is always on screen, an arriving message counts as opened right away. (We initially recorded this as impossible; corrected 2026-10-21.)
- Upgraded from the free Developer plan to Business to unlock the AI node.

### Where Knock and Courier were easier

- Neither needed a tunnel or sync step for local development. Their flows run entirely in their cloud, while Novu's code workflow needs Novu Cloud to reach your machine.
- Knock's workflow uses its built-in email channel (`knock-email`), so no third-party provider had to be connected, and it delivered our Run A email (2026-10-21). Per Knock's docs it only sends to members of the Knock account (other addresses fail with `knock_recipient_not_allowed`), and our test address was the account owner. Novu's built-in provider is limited to the logged-in user, and Courier has none, so both needed Resend.
- Knock exposes AI step prompts and outputs through its API (run events and message data). Courier shows them only in the dashboard, and we didn't check Novu's dashboard view.
