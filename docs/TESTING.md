# Test script

Run every test on all three platforms in the same session, and record results in `docs/SCORECARD.md` as you go. Screenshots of each result are the article's evidence, so take them.

Use owner mode for these tests: `http://localhost:3000/?owner=<DEMO_OWNER_TOKEN>`.

## Test 1: Notify and escalate

For each tab:

1. Click **Ship order**. Note the API time shown in the log.
2. Open the inbox. Note how long the message took to appear, and whether the AI line rendered.
3. **Run A:** leave the message unread. After about 2 minutes, check your email. The email should arrive.
4. Click **New demo user**, ship again.
5. **Run B:** read the in-app message straight away. After 2 minutes, the email should *not* arrive.
6. Record pass or fail for both runs, plus anything you had to work around.

## Test 2: AI step in the workflow

1. Check that the in-app message shows a generated sentence, not the fallback.
2. Note where the model call ran (vendor-hosted or your code), which model, and whether your plan allowed it.
3. Check the vendor's logs for the step. Can you see the prompt and output?

## Test 3: The customer replies

1. **Novu tab:** ask "Where is my order?" then "Can I change the delivery address?" Record whether the agent used the order details and how long replies took.
2. **Knock and Courier tabs:** search their current docs once more for inbound or two-way conversation features. If anything new exists, try it and update the panel copy.
3. **Owner only, Novu:** assign `parcelly-support` to the `order-shipped` workflow (Configure workflow > Send & reply via agent) with a Slack or email channel connected to the agent, trigger it, reply to the notification, and confirm the agent answers with the order in context. Screenshot the thread.

## Test 4: An agent builds it

This tests the "agents build your messaging" claim all three make. Use the same coding agent (for example Claude Code) and a fresh, empty account or environment for each platform.

1. Connect the platform's MCP server or CLI:
   - Novu: [Novu MCP](https://docs.novu.co/platform/build-with-ai/mcp)
   - Knock: `https://mcp.knock.app/mcp`, or `npm install -g @knocklabs/cli`
   - Courier: [Courier MCP](https://www.courier.com/docs/resources/mcp)
2. Paste this prompt, changing only the platform name:

   > Using **[Novu | Knock | Courier]**, create a workflow called `order-shipped`. It should: generate one personalized sentence about the shipped item with an AI step, send an in-app message with that sentence and a "Track package" link, wait 2 minutes, then send an email only if the in-app message hasn't been read. Use the payload fields orderId, customerName, item, carrier, trackingNumber, trackingUrl, and estimatedDelivery. Tell me anything you couldn't do.

3. Record:
   - Time from prompt to a working flow
   - How many follow-up prompts it needed
   - Manual fixes you made in the dashboard
   - What the agent said it couldn't do
4. Trigger the agent-built workflow once and check that it runs.

## Before publishing

- Re-check every "not available" claim against the vendors' docs within a week of publishing, and update the dates in the panel copy.
- Confirm pricing and plan limits on each vendor's pricing page.
