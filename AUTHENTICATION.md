# Farcaster Authentication – Troubleshooting & Fix Guide
*(AddPlayButton.xyz / Vercel)*

---

## 1. Problem Statement

After the last production deploy the **“Sign in with Farcaster”** flow began failing with:

```
Authentication timed out. Please try again or use demo mode.
Console: Auth Kit sign-in result: undefined
```

The error surfaces ~15 s after pressing **Connect Farcaster** and no user object is returned.

---

## 2. Root-Cause Analysis

| Category | Details |
|----------|---------|
| **Auth-kit version drift** | `"@farcaster/auth-kit": "latest"` installed a new major release whose callback flow changed. |
| **Hard-coded 15 s timeout** | Our hook aborted before the auth-kit finished on slower devices / cold starts. |
| **Domain/SIWE mismatch** | Auth-kit rejects requests if the configured `domain` or `siweUri` differs from `window.location.hostname/origin` (e.g. `addplaybutton.xyz` vs `www.addplaybutton.xyz`). |
| **Undefined guard** | We didn’t explicitly handle an `undefined` result, so the promise resolved silently then timed out. |

---

## 3. What Changed in the Fix

| Area | Change |
|------|--------|
| `hooks/use-farcaster-auth.ts` | • Timeout doubled to **30 000 ms** and cleared properly.<br>• Checks for **undefined** result and throws.<br>• Counts consecutive failures and auto-switches to **demo mode** after 2.<br>• Cleans up timers on unmount. |
| `components/farcaster-auth-provider.tsx` | • Reads hostname/origin safely at runtime.<br>• Warns when `domain !== hostname`, non-HTTPS, or hostname not whitelisted.<br>• Fails fast when required env vars missing. |
| **Environment** | Added **`.env.example`** (copy to `.env.local`) with:<br>`NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ALLOWED_DOMAINS`, `NEXT_PUBLIC_AUTH_TIMEOUT`. |
| **Documentation** | This file 😊 |

---

## 4. Quick-Start (Local)

1. Copy the template  
   ```bash
   cp .env.example .env.local
   ```
2. Set:
   ```
   NEXT_PUBLIC_APP_DOMAIN=localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_FORCE_REAL_AUTH=false  # mock mode by default
   ```
3. Install & run:
   ```bash
   pnpm i   # or npm/yarn
   pnpm dev
   ```
4. Visit `http://localhost:3000`, click **Connect Farcaster** – expect either:
   • Real wallet popup (if `FORCE_REAL_AUTH=true` and you have Warpcast), or  
   • Immediate **demo mode** sign-in.

Logs appear in browser console prefixed with 🔧, ⏰, ✅ etc.

---

## 5. Production / Vercel Deployment Checklist

| Step | Command / Setting |
|------|-------------------|
| **1. Domains** | Add both `addplaybutton.xyz` and `www.addplaybutton.xyz` in **Vercel → Settings → Domains**. |
| **2. Env Vars** | In **Vercel → Settings → Environment Variables** add for **Production**: <br>`NEXT_PUBLIC_APP_DOMAIN=addplaybutton.xyz`<br>`NEXT_PUBLIC_APP_URL=https://www.addplaybutton.xyz`<br>`NEXT_PUBLIC_ALLOWED_DOMAINS=addplaybutton.xyz,www.addplaybutton.xyz`<br>`NEXT_PUBLIC_FORCE_REAL_AUTH=true`<br>`WARPCAST_API_KEY=...` |
| **3. HTTPS** | Ensure Vercel SSL certs are issued (automatic). Auth-kit will refuse `http:` on non-localhost. |
| **4. Pin auth-kit** | Optionally pin a version: `@farcaster/auth-kit@^1.4.0` to avoid future breaking changes. |
| **5. Redeploy** | Push to `main` or trigger **“Redeploy”** in Vercel dashboard. |
| **6. Verify** | Open the production URL in Incognito, click **Connect Farcaster** – expect wallet flow & successful redirect. |

---

## 6. Verifying the Fix

1. **Console logs**  
   Look for  
   ```
   🔧 Initializing Farcaster Auth Kit with config: { domain: "addplaybutton.xyz", ... }
   📱 Auth Kit sign-in result: { fid: ... }
   ```
   and **no** ⏰ timeout warnings.

2. **Network tab**  
   Request to `/sign-in-with-ethereum` (SIWE) returns 200.

3. **LocalStorage**  
   Keys `farcaster-user` and `farcaster-auth` created with `isRealAuth: true`.

4. **Edge cases**  
   • Test on both apex and www domain.  
   • Throttle network (“Slow 3G”) – should still succeed within 30 s.  
   • Fail sign-in twice → switches to demo mode automatically.

---

## 7. Rollback / Failsafe

If Farcaster auth is critical and breaks again:

```bash
# .env.local
NEXT_PUBLIC_FORCE_REAL_AUTH=false
```
Commit / redeploy – users will be placed in demo mode until a proper hot-fix is shipped.

---

## 8. Tips & Gotchas

* Always deploy **env var changes** first, then code – Vercel separates these builds.
* Clearing `localStorage` or using Incognito avoids cached credentials during testing.
* Keep an eye on the auth-kit repo’s release notes; prefer pinned versions in production.

---

### Happy casting! 🎵
