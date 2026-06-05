# HRM Frontend — Request Flow (A to Z)

A complete walkthrough of what happens from the moment the browser sends a request to the moment the user sees a page.

---

## Architecture Overview

```
BROWSER  ──→  proxy.ts (edge guard)  ──→  Next.js Page / Server Action  ──→  NestJS API
```

| Layer | File | Runs on |
|---|---|---|
| Route guard | `src/proxy.ts` | Server (every request) |
| Login form | `src/app/(auth)/login/_components/LoginForm.tsx` | Browser |
| Server Actions | `src/app/(auth)/login/_actions/login.action.ts` | Server |
| API calls | `src/lib/auth/auth.api.ts` | Server |
| Cookie management | `src/lib/auth/session.ts` | Server |
| Dashboard layout | `src/app/(dashboard)/layout.tsx` | Server |

---

## Layer 0 — Before Anything Renders: `proxy.ts`

Every browser request hits `proxy.ts` **first**, before any page loads.

```
Browser → GET /dashboard
           ↓
        proxy.ts runs (matches every route except /api, /_next/static, images)
```

**Three cases are checked in order:**

```
Case 1: accessToken (hrm_at cookie) valid and not expired?
  → YES, protected route  → allow request through
  → YES, public route     → redirect to /dashboard (already logged in)

Case 2: accessToken expired but refreshToken (hrm_rt cookie) exists?
  → POST /api/v1/auth/refresh { refreshToken } to NestJS
  → Success → set new cookies silently, allow request through
  → Failed  → clear all cookies, redirect to /login?callbackUrl=/original-path

Case 3: No tokens at all?
  → Public route (/login etc.) → allow through
  → Protected route            → redirect to /login?callbackUrl=/original-path
```

**JWT expiry check** — no library used. The token payload is decoded manually via base64 and the `exp` claim is compared to `Date.now()` with a 30-second buffer to prevent race conditions.

---

## Layer 1 — Login Page: `GET /login`

```
Browser → GET /login
           ↓
        proxy.ts → no tokens → public route → allow through
           ↓
        src/app/(auth)/login/page.tsx  (Server Component)
           ↓
        Renders <LoginForm callbackUrl="..." />  (Client Component)
           ↓
        HTML sent to browser, React hydrates the form
```

---

## Layer 2 — Step 1: Email Check

Everything from here runs in the **browser** (Client Component — `LoginForm.tsx`):

```
User types email
  ↓
onChange  → update state, clear error
onBlur    → setEmailTouched(true) → show inline validation error if invalid

User clicks "Continue"
  ↓
handleEmailSubmit()
  ↓
Client-side check: regex email format valid?
  → NO  → show field error, stop here
  → YES → call checkEmailAction(email)   ← Server Action (crosses the network)
```

**Server Action call — browser POSTs to Next.js internal RPC:**

```
Browser → POST /_next/action  (Next.js internal)
           ↓
        login.action.ts → checkEmailAction() runs ON THE SERVER
           ↓
        Zod validates email (z.email())
           ↓
        fetch → POST http://localhost:3002/api/v1/auth/check-email
                body: { email }
           ↓
        NestJS: { success: true, data: { exists: true } }
           ↓
        Returns { ok: true } to browser
           ↓
        LoginForm: setStep('password') → CSS slide animation to Step 2
```

---

## Layer 3 — Step 2: Password + Sign In

```
User types password
  ↓
onChange  → update state, clear error
onBlur    → setPasswordTouched(true) → show inline validation error if short

User clicks "Sign in"
  ↓
handlePasswordSubmit()
  ↓
Client-side check: password.length >= 6?
  → NO  → show field error, stop here
  → YES → call loginAction(email, password, callbackUrl)  ← Server Action
```

**Server Action — three sequential calls on the server:**

```
Browser → POST /_next/action  (Next.js internal)
           ↓
        login.action.ts → loginAction() runs ON THE SERVER
           ↓
        Zod validates password (min 6 chars)
           ↓
        [A] loginApi(email, password)
              fetch → POST http://localhost:3002/api/v1/auth/login
              body: { email, password }
              ↓
              NestJS: { success: true, data: { accessToken, refreshToken } }
           ↓
        [B] getMeApi(accessToken)
              fetch → GET http://localhost:3002/api/v1/auth/me
              header: Authorization: Bearer <accessToken>
              ↓
              NestJS: { success: true, data: { id, email, firstName, role, ... } }
           ↓
        [C] setAuthCookies(tokens, user)
              Sets 3 cookies on the HTTP response:
                hrm_at   → accessToken   (httpOnly, secure, 1 day)
                hrm_rt   → refreshToken  (httpOnly, secure, 30 days)
                hrm_user → JSON user     (not httpOnly, 30 days — readable by JS for display)
           ↓
        redirect('/dashboard')  ← server-side, browser follows the redirect
```

---

## Layer 4 — Dashboard Loads

```
Browser → GET /dashboard  (now has cookies)
           ↓
        proxy.ts → reads hrm_at → decodes JWT → not expired → allow through
           ↓
        src/app/(dashboard)/layout.tsx  (Server Component)
           ↓
        getSessionUser() → reads hrm_user cookie → JSON.parse → AuthUser object
           ↓
        Layout renders:
          <Sidebar user={user} />   ← Client Component (mobile drawer, active links)
          <Header  user={user} />   ← Client Component (search, notifications, user menu)
          <main>{children}</main>
          <Footer />                ← Server Component (static)
           ↓
        children = src/app/(dashboard)/dashboard/page.tsx
           → Stats grid, quick actions, recent activity, department chart
           ↓
        Full HTML sent to browser, React hydrates interactive parts
```

---

## Layer 5 — Silent Token Refresh (Automatic)

Happens transparently while the user browses — they never see a logout screen.

```
User navigates to /employees after access token has expired
  ↓
Browser → GET /employees
           ↓
        proxy.ts
           ↓
        decodeJwt(hrm_at) → exp * 1000 < Date.now() + 30s → EXPIRED
           ↓
        hrm_rt exists? YES
           ↓
        silentRefresh(refreshToken):
          fetch → POST http://localhost:3002/api/v1/auth/refresh
          body: { refreshToken }
          ↓
          NestJS: new { accessToken, refreshToken }
           ↓
        New cookies set on the response (user sees nothing)
           ↓
        Request continues → /employees page loads normally
```

If the refresh token is also expired, the user is redirected to `/login?callbackUrl=/employees` and returned to that page after re-authenticating.

---

## Layer 6 — Logout

```
User clicks "Sign out" in Sidebar or Header dropdown
  ↓
logoutAction() Server Action
  ↓
  [A] logoutApi(accessToken)
        POST http://localhost:3002/api/v1/auth/logout  (best-effort, errors ignored)
  [B] clearAuthCookies()
        Deletes: hrm_at, hrm_rt, hrm_user
  [C] redirect('/login')
  ↓
Browser → GET /login → proxy.ts → no cookies → public route → login page
```

---

## NestJS API Response Shape

Every API response follows this envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": { ... },
  "timestamp": "2026-06-05T10:00:00.000Z"
}
```

`auth.api.ts` unwraps this automatically — callers receive `data` directly and never see the envelope. On failure it throws an `Error` with the `message` field so Server Actions can return it to the UI.

---

## Cookie Reference

| Cookie | Value | httpOnly | Expiry | Purpose |
|---|---|---|---|---|
| `hrm_at` | JWT access token | Yes | 1 day | Auth on every request |
| `hrm_rt` | JWT refresh token | Yes | 30 days | Silent refresh when `hrm_at` expires |
| `hrm_user` | JSON user object | No | 30 days | Read user info client-side for display |

---

## Full Visual Diagram

```
BROWSER                    NEXT.JS SERVER              NESTJS BACKEND
   |                            |                            |
   |──GET /login──────────────→ |                            |
   |                     proxy.ts: no token, public → allow  |
   |←── HTML (login page) ───── |                            |
   |                            |                            |
   |──[Step 1] type email ─────→|                            |
   |   checkEmailAction()       |──POST /check-email────────→|
   |                            |←── { exists: true } ───────|
   |←── { ok: true } ──────────|                            |
   |   slide to password step   |                            |
   |                            |                            |
   |──[Step 2] type password ──→|                            |
   |   loginAction()            |──POST /login──────────────→|
   |                            |←── { accessToken, rt } ────|
   |                            |──GET /me (Bearer) ────────→|
   |                            |←── { user object } ────────|
   |                            |  set 3 cookies             |
   |←── 302 redirect /dashboard|                            |
   |                            |                            |
   |──GET /dashboard───────────→|                            |
   |                     proxy.ts: valid token → allow       |
   |                     getSessionUser() reads cookie       |
   |←── HTML (dashboard) ───────|                            |
   |                            |                            |
   |──GET /employees (1 day later)→                          |
   |                     proxy.ts: token expired             |
   |                            |──POST /refresh ───────────→|
   |                            |←── new tokens ─────────────|
   |                     set new cookies silently            |
   |←── HTML (/employees) ──────|                            |
```
