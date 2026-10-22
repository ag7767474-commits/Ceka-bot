# Darkbot

## Run on Replit

This imported project is a Node.js console-based WhatsApp bot using Baileys.
There is no website, web preview, or HTTP port.

- Use the **Run WhatsApp bot** workflow (Run button), or run `npm start`.
- Dependencies are recorded in `package.json` and `package-lock.json`.
- Run `npm run check` to check JavaScript syntax. The imported project has no automated test suite.

## WhatsApp pairing

The bot and owner phone numbers are configured as `BOT_PHONE` and `OWNER_PHONE`
at the top of `index.js`. Confirm these belong to the intended accounts before pairing.
Use international digits only (country code included, without `+` or spaces).

On first startup, the bot requests a pairing code and prints it in the Console.
On the bot account's phone, open WhatsApp → Linked devices → Link a device →
Link with phone number instead, then enter that code. Do not share pairing codes.
If a code expires, stop and rerun the workflow to request another.

Session credentials are stored locally in `auth_info/`, which is excluded from
Git and publishing. Keep that directory private. Subsequent runs reuse the session.
No API keys or external database are required by the current bot.

After successful pairing, send `menu` from another WhatsApp account to check
the bot's response. Commands restricted to the owner must come from the configured
owner account.

## Existing limitations

- The imported calculator uses `eval` on incoming message text. This can execute
  arbitrary JavaScript with the bot process's privileges. Do not pair this bot
  with an account exposed to untrusted senders until that command is secured.
- Some advertised commands only return canned messages; setup does not implement
  missing group-management or AI features.
- Full message delivery can only be verified after the account owner completes
  WhatsApp pairing.
