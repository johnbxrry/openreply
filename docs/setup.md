# Setup

Everything you need to get OpenReply running end to end, in one place: hosting, the domain, environment variables, and the Meta app. Read it in order. The code deploys in minutes. The Meta side is the part that takes real time, so budget an afternoon the first time.

This guide was rewritten after a full real-world deployment, and the hosting steps now use the Railway and Vercel CLIs, because that path avoids the dashboard's sharp edges (and works well when an AI assistant is driving). Every dashboard-only step that used to be here has a CLI equivalent below. If you prefer clicking, the dashboards still work; the notes tell you where they diverge.

If you would rather have an AI assistant drive most of this, skip to [Set it up with an AI assistant](#set-it-up-with-an-ai-assistant) at the end and come back here when it asks for specifics.

## How it is built

OpenReply is two processes and two datastores.

- Web app and API: Next.js. Serves the dashboard, the OAuth callback, and the incoming webhook. Runs well on Vercel.
- Worker: a long-running Node process (`npm run worker`) that consumes the send queue and runs the polling reconciler. It cannot run on Vercel, because serverless functions are short-lived and a queue consumer has to stay up. Railway, Render, Fly, or any always-on box works.
- PostgreSQL: campaigns, logs, accounts, sessions.
- Redis: the BullMQ send queue and the per-account rate limiter.

The web app and the worker must share the same `DATABASE_URL`, the same `REDIS_URL`, and the same `ENCRYPTION_KEY`. The web app writes an encrypted Instagram token; the worker decrypts it to send. Different keys mean every send fails to decrypt.

## What you need first

- **Node.js 24 or newer** on your machine. Prisma 7 requires Node 20.19+/22.12+/24+, and the repo pins Node 24 via `.node-version` so local, Railway, and Vercel all agree. If you use nvm: `nvm install 24`.
- A Facebook account. Meta developer registration is built on it. There is no Instagram-only path.
- An Instagram Business or Creator account. A personal account cannot be connected. Switch it in the Instagram app under Settings, Account type, if needed.
- A [Resend](https://resend.com) account for login emails, with a verified sender domain. Login is email magic links only, so without this nobody can sign in.
- Somewhere to host. The recommended setup, used throughout this guide, is Vercel for the web app and Railway for the worker plus Postgres and Redis. Both have free tiers that are enough to run this for a single account.

Install both CLIs once:

```bash
npm install -g @railway/cli vercel
```

## Hosting and your domain

You do not need to buy a domain. Deploying the web app to Vercel gives you a free public URL like `your-app.vercel.app`, and that URL is what everything else points at: `NEXTAUTH_URL`, the Meta OAuth redirect, and the Meta webhook callback all use it. If you want a custom domain later you can add one, but it is optional and you can launch without it.

Recommended split:

- Web app: Vercel.
- Worker, Postgres, Redis: Railway.

Do Railway first, because Vercel needs the database URLs from it.

### Step 1: Railway (Postgres, Redis, worker)

Log in, create the project, and add the two databases. `railway login` opens a browser; if you are on a remote machine or an assistant is driving, `railway login --browserless` prints a URL and pairing code instead.

```bash
railway login
cd openreply        # your clone of this repo
railway init --name openreply
railway add --database postgres
railway add --database redis
```

Create the worker as an **empty service** and deploy it straight from your clone. This deliberately skips Railway's GitHub integration — no GitHub app to install, no repo permissions to grant, and it works from a private fork:

```bash
railway add --service worker
```

Before the first deploy, set the worker's variables. Use Railway **reference variables** for the datastore URLs — inside Railway's network they resolve to the internal hostnames (`postgres.railway.internal`, `redis.railway.internal`), which are faster and free of egress. Single-quote them so your shell does not eat the `${{ }}`:

```bash
railway variables --service worker \
  --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' \
  --set 'REDIS_URL=${{Redis.REDIS_URL}}' \
  --set 'NEXTAUTH_SECRET=<generate: openssl rand -base64 32>' \
  --set 'CRON_SECRET=<generate: openssl rand -base64 32>' \
  --set 'ENCRYPTION_KEY=<generate: openssl rand -hex 32>' \
  --set 'WEBHOOK_VERIFY_TOKEN=<generate: openssl rand -hex 16>' \
  --set 'META_GRAPH_API_VERSION=v25.0' \
  --skip-deploys
```

(`NEXTAUTH_URL`, the Resend values, and the Meta secrets come later — you do not have them yet. The worker will boot without them.)

Then deploy:

```bash
railway up --service worker --detach
```

The repo ships a `railway.json` (Railpack builder, `npm run db:generate` build, `npm run worker` start) and a `.node-version` file, so you do not configure Build or Start commands anywhere.

> **If the worker build fails on Node or Prisma versions:** this is why the repo uses the Railpack builder. Railway's default Nixpacks builder ships a Node too old for Prisma 7; pinning `NIXPACKS_NODE_VERSION=22` resolves to 22.11, which is still below Prisma's 22.12 floor; and Nixpacks has no `nodejs_24` package at all. Railpack reads `.node-version` and installs a real Node 24. If you see `Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+` in a build log, the service is not using the repo's `railway.json` — check that you deployed from the repo root.

The worker only needs the generated Prisma client, not `next build`, and its build must never run migrations: the builder cannot reach Postgres at build time. Migrations are applied by the web app's `vercel-build` and by the manual `db:migrate` below, never by the worker.

#### Public endpoints for the databases (do not skip)

The worker reaches Postgres and Redis over Railway's private network, but **Vercel and your own machine cannot** — they need public endpoints, and databases created via the CLI do not get one automatically. Create a TCP proxy for each:

```bash
railway tcp-proxy create --service Postgres --port 5432
railway tcp-proxy create --service Redis --port 6379
```

Each command prints an endpoint like `<region>.proxy.rlwy.net:<port>`. Compose the public URLs from those endpoints plus the credentials Railway generated:

```bash
railway variables --service Postgres --kv   # note PGPASSWORD
railway variables --service Redis --kv      # note REDIS_PASSWORD
```

- Public Postgres URL: `postgresql://postgres:<PGPASSWORD>@<region>.proxy.rlwy.net:<port>/railway`
- Public Redis URL: `redis://default:<REDIS_PASSWORD>@<region>.proxy.rlwy.net:<port>`

These two public URLs are what Vercel gets in Step 3. Never give Vercel the internal `*.railway.internal` URLs — from outside Railway they hang and time out.

(Dashboard equivalent: each database service's Settings → Networking → TCP Proxy, after which a `DATABASE_PUBLIC_URL` / `REDIS_PUBLIC_URL` variable appears.)

### Step 2: Migrate the production database

Run once from your machine, using the public Postgres URL you just composed:

```bash
DATABASE_URL="postgresql://postgres:<PGPASSWORD>@<region>.proxy.rlwy.net:<port>/railway" npm run db:migrate
```

### Step 3: Vercel (web app, and your domain)

```bash
vercel login you@example.com     # click the confirmation link Vercel emails you
vercel link --yes --project openreply
```

Add the environment variables. The stdin pattern below keeps secret values out of your shell history:

```bash
printf '%s' "postgresql://postgres:<PGPASSWORD>@<region>.proxy.rlwy.net:<port>/railway" | vercel env add DATABASE_URL production
printf '%s' "redis://default:<REDIS_PASSWORD>@<region>.proxy.rlwy.net:<port>" | vercel env add REDIS_URL production
printf '%s' "<same NEXTAUTH_SECRET as the worker>" | vercel env add NEXTAUTH_SECRET production
printf '%s' "<same CRON_SECRET as the worker>" | vercel env add CRON_SECRET production
printf '%s' "<same ENCRYPTION_KEY as the worker>" | vercel env add ENCRYPTION_KEY production
printf '%s' "<same WEBHOOK_VERIFY_TOKEN as the worker>" | vercel env add WEBHOOK_VERIFY_TOKEN production
printf '%s' "v25.0" | vercel env add META_GRAPH_API_VERSION production
printf '%s' "<your Resend API key>" | vercel env add RESEND_API_KEY production
printf '%s' "noreply@<your-verified-domain>" | vercel env add EMAIL_FROM production
```

`ENCRYPTION_KEY` must be the exact same value as on the worker. Deploy:

```bash
vercel deploy --prod --yes
```

**Finding your real public domain.** A deployment gets several URLs, and they are not interchangeable:

```bash
vercel inspect <the-deployment-url-it-printed>   # look at the Aliases section
```

The team-scoped alias (it contains your Vercel team slug) may sit behind Vercel Deployment Protection, answering every request with a 302 to an SSO page. The plain project alias (`your-app-xxxx.vercel.app`) is the public one. Verify before wiring anything to Meta:

```bash
curl -i https://your-app.vercel.app/api/health     # expect a direct 200/503 JSON answer, not a 302
curl -i -X POST https://your-app.vercel.app/api/webhook   # expect 401 (unsigned), NOT a redirect
```

A domain that redirects POSTs can never receive webhooks — Meta does not reliably follow redirects, and delivery fails silently.

**`NEXTAUTH_URL` is a chicken-and-egg**: you only learn the domain after the first deploy. Set it now and deploy once more (env changes only apply to new deployments):

```bash
printf '%s' "https://your-app.vercel.app" | vercel env add NEXTAUTH_URL production
vercel deploy --prod --yes
```

Also set the same value on the worker — tracked links inside DMs are built from it:

```bash
railway variables --service worker --set 'NEXTAUTH_URL=https://your-app.vercel.app'
```

The build runs `npm run vercel-build` (`prisma generate && prisma migrate deploy && next build`), configured in `vercel.json` under `services.web.buildCommand`. Do not change that to anything that skips `next build` — the `services` block *replaces* the framework build rather than prepending to it, and the deploy fails with `The Next.js output directory ".next" was not found`.

Note on crons: Vercel's free plan allows each cron to run at most once per day. The repo's crons are set to daily for that reason. The comment polling reconciler does not use a Vercel cron; it runs inside the Railway worker on its own interval, so the free plan is not a constraint there.

Optional custom domain: add it in Vercel under Domains and make it primary. Then update `NEXTAUTH_URL` (on Vercel **and** the worker) and the two Meta URLs (Step 7 and Step 8) to the new domain. Re-run the two `curl` checks above against the new domain before touching the Meta config.

## Environment variables

Copy `.env.example` to `.env` for local work, or set these in Vercel and Railway as shown above.

| Variable | What it is |
| --- | --- |
| `NEXTAUTH_URL` | Your public URL. Your Vercel domain in production, your tunnel URL locally. |
| `NEXTAUTH_SECRET` | Random secret. `openssl rand -base64 32` |
| `CRON_SECRET` | Random secret protecting the token-refresh cron. |
| `ENCRYPTION_KEY` | 32-byte hex. `openssl rand -hex 32`. Encrypts Instagram tokens. Identical across web and worker. |
| `DATABASE_URL` | PostgreSQL connection string. Public proxy URL on Vercel; internal reference on the worker. |
| `REDIS_URL` | Redis connection string. Must support blocking commands, so an HTTP-only Redis will not work with BullMQ. |
| `RESEND_API_KEY` | Resend key. Login is email magic links only, so without this nobody can sign in. |
| `EMAIL_FROM` | A sender on a domain you verified in Resend. The mailbox does not need to exist — it is send-only. The placeholder will not deliver. |
| `META_GRAPH_API_VERSION` | Graph API version, for example `v25.0`. |
| `INSTAGRAM_APP_ID` | From the Meta app, see Step 5. |
| `INSTAGRAM_APP_SECRET` | From the Meta app. |
| `FACEBOOK_APP_SECRET` | From the Meta app. |
| `WEBHOOK_VERIFY_TOKEN` | Any random string. You paste the same value into Meta's webhook config. |

`ENCRYPTION_KEY` must be exactly 64 hex characters or the app throws on boot.

Optional, for tuning the polling reconciler (defaults are fine to start):

| Variable | Default | What it does |
| --- | --- | --- |
| `COMMENT_POLL_INTERVAL_MS` | `300000` | How often the worker sweeps for missed comments (5 min). |
| `COMMENT_POLL_MAX_PER_SWEEP` | `30` | Max new comments each campaign acts on per sweep. Keep it conservative; higher gets closer to Instagram's rate limits. |
| `COMMENT_POLL_LOOKBACK_HOURS` | `72` | How far back a sweep considers comments. |

Lowering the poll interval makes unpublished-app delivery faster (see Step 9) at the cost of more Graph API calls: each sweep is roughly one comments-fetch per active campaign. One campaign at a 1-minute interval is ~1,440 calls/day and fine; many campaigns or `matchAnyPost` multiply that and start flirting with Instagram's comment-API throttling (error 368). Meta does not charge for API calls — the trade-off is rate limits, not money.

## The Meta app

This is the slow part. The code works out of the box; getting Meta to send you comment events is where people lose an afternoon. Every step here exists because skipping it breaks something later. Have your Vercel domain from Step 3 ready, you will paste it in a few times.

A note on the console layout before you start: Meta's developer console changes often. In the current layout there is **no "Instagram" item in the left sidebar** — the Instagram product lives inside **Use cases → Customize**. Steps below give the current path first and the older path in parentheses. If a screen matches neither, stop and compare carefully rather than clicking the nearest lookalike.

### Step 4: Create the Meta app

Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) and create an app.

- App type: Business.
- Contact email: one you actually check.

When it asks you to add a use case, filter to All, then choose **Manage messaging and content on Instagram**. Do not pick "Create and manage ads with Marketing API", and do not pick "Authenticate with Facebook Login". OpenReply uses Instagram Login. Picking the Facebook Login variant makes the OAuth flow fail later with a mismatched client error.

After creation, the left sidebar may show a "Facebook Login for Business" item and **no Instagram item. This is normal** in the current console and does not mean you picked the wrong use case — verify on the **Use cases** page that your card reads "Manage messaging & content on Instagram", and simply never touch the Facebook Login product. If you accidentally added the Marketing API use case, remove it; it has its own heavy review requirements and can block publishing.

### Step 5: Collect the three secrets

There are two app secrets and two app IDs, which is confusing. Here is what maps to what.

| Environment variable | Where it lives |
| --- | --- |
| `INSTAGRAM_APP_ID` | Use cases → Customize → API setup with Instagram business login. A long number. |
| `INSTAGRAM_APP_SECRET` | Same page, click Show |
| `FACEBOOK_APP_SECRET` | App settings → Basic → the field labeled just "App secret", click Show |

Two traps:

- The Instagram app ID is **not** the same number as the App ID shown on the Basic settings page. Use the one under the Instagram product. If you paste the Basic-page App ID into `INSTAGRAM_APP_ID`, OAuth fails later.
- The Basic page's field is labeled just "App secret" — there is no field literally named "Facebook app secret". That field **is** `FACEBOOK_APP_SECRET`.

OpenReply verifies webhook signatures against both `FACEBOOK_APP_SECRET` and `INSTAGRAM_APP_SECRET`, so you do not have to guess which one Meta signs with. Set both, on Vercel and on the worker, then redeploy the web app (env changes need a new deployment).

### Step 6: Add your Instagram account as a tester, and accept the invite

This is the step people miss, and it produces the error "Insufficient Developer Role" — both on the Instagram login screen and, in the current console, **when you open Use cases → Customize before the invite is accepted**. If Customize throws that error at you, it means this step is incomplete, not that your app is broken.

There are two halves. Both are required.

**Half one, on the Meta side.** Open App roles → Roles and add your exact Instagram username as an **Instagram Tester** (in the current console the row appears in the roles list with role "Instagram Tester" and status "Pending"; it is also reachable from the Instagram product under "Generate access tokens"). Send the invite.

**Half two, on the Instagram side.** This is the part that gets skipped. The invite must be **accepted from the invited Instagram account**:

1. Open Instagram as that account (the phone app is easiest).
2. Go to your profile, then the menu, then Settings and activity.
3. Open Apps and websites (older versions: Website permissions, then Apps and websites).
4. Open the **Tester invites** tab and accept.

Two things that trip people up here:

- The **Tester invites tab only exists while a pending invite exists**, and only on the invited account. If you see just Active / Expired / Removed and no Tester invites, either the invite was not created as an *Instagram* tester invite (the plain "Testers" role is a Facebook role — its invites never appear in Instagram), or your phone is logged into a different account than the one you invited.
- The fastest route when the tab is elusive: back in the Meta console's roles list, the pending row itself contains an **"Apps and Websites" hyperlink** — click it and it lands you exactly on the acceptance screen for the right account.

Until you accept, the account is not really a tester and the login will keep failing. If you do not see the invite, double-check you sent it to the exact username and that the account is a Business or Creator account.

### Step 6b: Activate the four permissions

In the use case's **Permissions and features** list, activate exactly these four — they are the scopes OpenReply requests during OAuth (see `lib/meta/oauth.ts`):

- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`
- `instagram_business_manage_insights`

The list is long and full of lookalikes from the older Facebook-Page-based API. Do not enable those:

| Activate (Instagram Login API) | Do NOT activate (old Facebook-Page API) |
| --- | --- |
| `instagram_business_basic` | `instagram_basic` |
| `instagram_business_manage_comments` | `instagram_manage_comments` |
| `instagram_business_manage_messages` | `instagram_manage_messages` |
| `instagram_business_manage_insights` | `instagram_manage_insights` |

Also skip everything ads-related, `business_management`, `pages_*`, and the content-publish permissions. Standard Access on the four is enough for your own tester accounts; Advanced Access only matters if strangers will connect (see the last section).

### Step 7: Register the OAuth redirect

In Use cases → Customize, open **Set up Instagram business login**, then Business login settings. In the OAuth redirect URIs field, add exactly, using your domain:

```
https://your-app.vercel.app/api/instagram/callback
```

No trailing slash. If this is missing or wrong, connecting an account fails with a redirect_uri mismatch. You can register more than one, which is useful if you change domains later; keep the old and new both listed.

You do not need the "Embed URL" that Meta shows here. OpenReply builds its own login URL. Users connect by opening your app, going to Settings, and clicking Connect Instagram.

### Step 8: Configure the webhook

Still in the Customize area, find the Configure webhooks step.

- Callback URL: `https://your-app.vercel.app/api/webhook`
- Verify token: the value of `WEBHOOK_VERIFY_TOKEN` from your environment
- Click Verify and save. It should succeed immediately, because the app answers Meta's verification challenge. If the button is greyed out, click into the verify-token field and paste the token again; editing the callback URL often clears it.
- Subscribe to the `comments` field.

You can prove the endpoint works before involving Meta at all:

```bash
curl "https://your-app.vercel.app/api/webhook?hub.mode=subscribe&hub.verify_token=<your WEBHOOK_VERIFY_TOKEN>&hub.challenge=test12345"
```

A working deployment echoes `test12345` back; a wrong token gets a 403. If that curl works, Meta's Verify and save will too.

To test delivery without a real comment, click Test next to `comments`, then click Send to My Server. This is a two-step control. Clicking Test only previews the sample payload; the second button is what actually POSTs it to your endpoint. After sending, a row should appear in your `WebhookEvent` table.

If your primary domain ever changes, update this callback URL to the new domain. A non-primary domain will 307-redirect the POST, and Meta does not reliably follow redirects, so webhooks silently stop.

### Step 9: Publish the app (optional, read this before fighting it)

Real comment webhooks are only delivered when the app is in Live state. In Development mode, only the console Test button delivers events.

**But an unpublished app still works.** OpenReply's worker runs a polling reconciler that sweeps every active campaign's post on an interval (`COMMENT_POLL_INTERVAL_MS`, default 5 minutes), matches keywords, and sends DMs through exactly the same pipeline as webhook-delivered comments. It exists because Instagram webhooks are best-effort even for published apps. Practical upshot: with the app unpublished, comment-to-DM works end to end with up to a few minutes of delay instead of a second or two. For a single account, many people never publish at all.

If you want near-instant delivery, publish:

1. The Publish page will demand a privacy policy, terms of service, and data deletion URL first. These fields live under **App settings → Basic** (the Publish page's "Go to app settings" link takes you there — the URLs are entered on the Basic page, not on the Publish page itself). OpenReply ships all three pages on your domain:

```
https://your-app.vercel.app/privacy
https://your-app.vercel.app/terms
https://your-app.vercel.app/data-deletion
```

2. Save the Basic page, then **reload the Publish page** — it caches requirement state and will keep claiming the URLs are missing until you do.
3. If Publish still refuses, click the chevron (›) on the use-case row on the Publish page. It expands the actual outstanding requirements, which beats guessing.
4. Then publish. Depending on your access level, Meta may let you go live for your own tester accounts immediately, or it may require App Review first (see the last section). If it demands App Review and you are only running your own account, skip publishing and let the poller deliver.

### The account ID trap (informational)

You do not have to do anything here; OpenReply handles it. It is worth understanding because it is invisible when it goes wrong.

Meta's `/me` returns two IDs. The `id` field is app-scoped. The `user_id` field is the Instagram professional account ID (it typically starts with `178…`). Webhooks put `user_id` in `entry.id`, and the messaging API keys off `user_id` too. OpenReply stores `user_id`, so a fresh connection matches correctly. If you upgraded from a very old build and an account was stored with the wrong ID, disconnect and reconnect it once.

## Test it end to end

1. Make sure the account is a tester and has accepted the invite (Step 6), and the four permissions are active (Step 6b).
2. Log in to your instance with your email; the magic link should arrive from your `EMAIL_FROM` address within a minute.
3. Connect the account: Settings, Connect Instagram. You should reach Instagram's consent screen, not the "Insufficient Developer Role" error.
4. Create a campaign on one of your posts with a keyword like `TEST`.
5. **From a different Instagram account**, comment `TEST` on that post. It must be a different account — OpenReply filters out the connected account's own comments on purpose (Meta rejects self-DMs), so a self-comment produces no log entry at all, which looks exactly like "nothing happened".
6. Watch for the DM. **If the app is unpublished, delivery comes from the poller — wait up to one full `COMMENT_POLL_INTERVAL_MS` before concluding anything is wrong.** Impatience at this step is the single biggest source of false alarms.

Hit `/api/health` any time. It reports the database, Redis, queue, and worker heartbeat. If `worker.healthy` is false, the worker is not running or cannot reach Redis, and no DM will send even though webhooks are being received.

If you want to inspect where a comment stopped, the Postgres tables tell you (connect with any client using the public proxy URL from Step 1):

```sql
-- Did the event arrive at all? (webhook deliveries land here)
SELECT "createdAt", LEFT(payload::text, 200) FROM "WebhookEvent" ORDER BY "createdAt" DESC LIMIT 5;

-- What did the sender do with it? status SENT / SKIPPED / FAILED plus the reason
SELECT "createdAt", status, "commenterName", "commentText", "matchedKeyword", "errorMessage"
FROM "DmLog" ORDER BY "createdAt" DESC LIMIT 10;

-- Worker errors and each poller sweep's summary
SELECT "createdAt", source, level, message FROM "OperationalEvent" ORDER BY "createdAt" DESC LIMIT 10;
```

A healthy unpublished-app test shows: nothing in `WebhookEvent` (no webhooks without publishing), one `OperationalEvent` INFO row per sweep that found work ("1 enqueued, 1 matched"), and a `SENT` row in `DmLog`.

## Local development

You need Postgres and Redis. The included `docker-compose.yml` starts both:

```bash
docker-compose up -d
npm run db:generate
npm run db:migrate
```

Or install them natively (macOS):

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb openreply
```

Then set `DATABASE_URL` to match your local user, for example `postgresql://YOUR_USER@localhost:5432/openreply`.

Run the two processes in separate terminals:

```bash
npm run dev
npm run worker
```

For Meta to reach your local webhook, run a tunnel and point `NEXTAUTH_URL` and the Meta webhook and redirect URLs at the tunnel:

```bash
ngrok http 3000
```

## Set it up with an AI assistant

If you run an AI coding assistant like Claude Code or Cursor, it can drive most of this for you — including the Railway and Vercel CLI steps, which it can run itself while you handle the browser-only parts (CLI logins, the Meta console, the Instagram app). Open a clone of this repo inside your assistant and paste the prompt below. Give it your keys as it asks for them.

A word of caution: the assistant will need real secrets to finish (Meta app secrets, a Resend key). Only paste those into a tool and environment you trust, and rotate them afterward.

```
You are helping me self-host OpenReply, an open source Instagram comment-to-DM
automation tool, in this repository. Read README.md and docs/setup.md first, then
help me get it running end to end.

My goal: <describe it. For example: run it for my own Instagram account only,
or host it for other people to sign up.>

Work through this in order and stop to ask me whenever you need a value or an
action only I can do:

1. Local or hosted. Ask me which I want. If hosted, we use Vercel for the web
   app (its domain becomes my public URL) and Railway for the worker plus
   Postgres and Redis, driven through their CLIs (npm i -g @railway/cli vercel).
   Use browserless/email login flows and have me approve them in my browser. If
   local, we use docker-compose and a tunnel.

2. Datastores. Create the Railway project, Postgres, and Redis via the CLI.
   Create TCP proxies for both (CLI-created databases have no public endpoint
   by default), compose the public URLs, and run the Prisma migration against
   the public Postgres URL.

3. Environment. Generate NEXTAUTH_SECRET, CRON_SECRET, ENCRYPTION_KEY, and
   WEBHOOK_VERIFY_TOKEN for me. Ask me for my Resend API key and a sender
   address on my verified domain, and for the three Meta secrets once I create
   the app. ENCRYPTION_KEY must be identical on the web app and the worker.
   The worker should use Railway reference variables for its datastore URLs.

4. Deploy. Deploy the worker with `railway up` (the repo's railway.json and
   .node-version handle the builder; no GitHub integration needed). Deploy the
   web app with the Vercel CLI, find the real public alias (watch out for
   Vercel Deployment Protection on team-scoped aliases), verify with curl that
   GET /api/health answers directly and POST /api/webhook returns 401 without
   redirecting, then set NEXTAUTH_URL on both processes and redeploy. Confirm
   /api/health returns ok with worker.healthy true.

5. Meta app. Walk me through the Meta app section of docs/setup.md one step at
   a time. The console keeps changing: Instagram lives under Use cases →
   Customize, the sidebar may show Facebook Login for Business (ignore it),
   and "Insufficient Developer Role" on Customize means my tester invite is
   not yet accepted. Make sure I activate the four instagram_business_*
   permissions and not the old instagram_* lookalikes. Verify my webhook
   endpoint with the curl challenge check before I click Verify and save.
   Remember the account ID trap (store user_id, not id), and that publishing
   is optional: the polling reconciler delivers DMs on an interval without
   webhooks, so if publishing is blocked, do not let me get stuck there.

6. Test. Have me create a campaign and comment the keyword from a SECOND
   account (self-comments are filtered by design), then confirm the DM sent by
   checking the DmLog table and the DM Logs page. If the app is unpublished,
   wait a full poll interval before diagnosing.

Rules for you:
- Never invent Meta dashboard steps. If a screen does not match the guide, ask
  me to screenshot it.
- Diagnose failures by querying the Postgres tables directly: WebhookEvent for
  delivery, DmLog for send status, OperationalEvent for worker errors and
  poller sweep summaries. This is faster than logs.
- Remind me to rotate any secret I paste to you before real use.

Start by reading the docs, then ask me question 1.
```

By the end, `/api/health` returns `status: ok` with `worker.healthy: true`, and a comment with your keyword from a second account produces a `SENT` row in the DM logs. If you get there, you are done.

## Letting other people use your instance

Everything above is enough to run OpenReply for your own accounts, or a handful of accounts you add as testers. No App Review needed.

For a stranger to connect their own Instagram to your hosted instance, Meta requires App Review granting Advanced Access on the messaging and comments permissions. That means:

- A screencast of the full flow working, recorded on real accounts in one take.
- A written justification for each permission. Drafts are in [../META_APP_REVIEW.md](../META_APP_REVIEW.md).
- Business verification, which asks for a document proving a legal business entity: a business registration or license, articles of incorporation, a business tax document, or a business bank statement.

Meta scrutinizes automated-DM apps and often rejects the first submission, so budget for a resubmit. If you do not have a registered business, most self-hosters skip this entirely by running their own instance for their own account, which never needs review.

## Security notes

- `.env` is gitignored. Keep it that way.
- Rotate any secret that has been pasted anywhere it could be logged, including a chat with an AI assistant. That includes the generated secrets, not just the Meta and Resend ones. Two rotations have side effects: a new `ENCRYPTION_KEY` forces every connected account to reconnect, and a new `WEBHOOK_VERIFY_TOKEN` must also be updated in the Meta webhook config.
- Instagram tokens are encrypted at rest with `ENCRYPTION_KEY`. Losing or changing it means every connected account has to reconnect.
- Anyone can create an empty account on your instance (login is open by design), but they cannot see your data — everything is workspace-scoped — and they cannot connect an Instagram account without being a tester on your Meta app.
