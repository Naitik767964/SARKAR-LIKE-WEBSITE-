# Free Fire Like Panel — Vercel starter

Configured defaults from the supplied settings:
- Like API template: `https://likeapiindbd.vercel.app/like?uid={uid}&server_name={server}`
- Telegram log destination: `-1004342336431`
- Force-join link: `https://t.me/freefirelikesandtcpbot`
- Telegram bot username: `@SAARKARLIKEBOT`

## Deploy on Vercel (Android-friendly)
1. Download and extract this ZIP.
2. Upload the extracted project to a GitHub repository (create a repository and upload the files, keeping the `api/` folder at the project root).
3. Open Vercel and choose **Add New → Project**, then import that GitHub repository.
4. Framework preset: **Other**. Leave Build Command empty; Output Directory can be `.`. Deploy.
5. In Vercel project **Settings → Environment Variables**, add the variables below and select Production (and Preview if desired).
6. Redeploy after saving variables. Vercel's environment-variable changes only apply to new deployments.

## Required environment variables
- `SUPABASE_URL` — Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key. Secret; never place in browser code or public repository.
- `TELEGRAM_BOT_TOKEN` — bot token from BotFather. Secret; set only in Vercel.

## Optional overrides (defaults are already in code)
- `LIKE_API_URL` = `https://likeapiindbd.vercel.app/like?uid={uid}&server_name={server}`
- `LOG_CHANNEL_ID` = `-1004342336431`
- `FORCE_JOIN_CHANNELS` = `Free Fire Likes & TCP Bot|https://t.me/freefirelikesandtcpbot`
- `TELEGRAM_BOT_USERNAME` = `@SAARKARLIKEBOT`

## Database setup
Create a Supabase project, open SQL Editor, and run `supabase.sql`. Keep the service-role key private.

## Telegram logging
Add `@SAARKARLIKEBOT` (or the bot whose token you set) to the log channel/group and grant permission to send messages. The bot token must belong to the bot you added.

## Important limitations before public use
- This project is a starter and has not been live-tested against your API. Provider response fields may differ; adjust `getCounts()` in `api/send-likes.js` to match the actual JSON.
- Force-join links are displayed, but actual membership verification is not enabled. The Verify button is a placeholder; do not advertise it as enforced until Telegram Login Widget identity validation and server-side `getChatMember` checking are implemented.
- Daily limit currently applies per UID + region per India calendar day, not per Telegram account. The check-and-insert is not atomic under simultaneous requests; a database RPC/transaction is recommended before public use.
- The configured API uses an HTTPS URL in this bundle. Confirm that the provider supports it.
