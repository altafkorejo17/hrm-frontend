# HRM Frontend — Request Flow (A to Z)

A complete walkthrough of what happens from the moment the browser sends a request to the moment the user sees a page. Covers every layer: route guard, rendering, server actions, API calls, cookies, token refresh, and logout.

---

## Table of Contents

1. [Tech Stack at a Glance](#tech-stack-at-a-glance)
2. [Architecture Overview](#architecture-overview)
3. [What is a Server Component vs Client Component?](#what-is-a-server-component-vs-client-component)
4. [What is a Server Action?](#what-is-a-server-action)
5. [Layer 0 — Route Guard: proxy.ts](#layer-0--route-guard-proxyts)
6. [Layer 1 — Login Page Renders](#layer-1--login-page-renders)
7. [Layer 2 — Step 1: Email Check](#layer-2--step-1-email-check)
8. [Layer 3 — Step 2: Password & Sign In](#layer-3--step-2-password--sign-in)
9. [Layer 4 — Dashboard Loads](#layer-4--dashboard-loads)
10. [Layer 5 — Silent Token Refresh](#layer-5--silent-token-refresh)
11. [Layer 6 — Logout](#layer-6--logout)
12. [Error Handling](#error-handling)
13. [Cookie Reference](#cookie-reference)
14. [NestJS API Response Shape](#nestjs-api-response-shape)
15. [File Responsibility Map](#file-responsibility-map)
16. [Full Visual Diagram](#full-visual-diagram)

---

## Tech Stack at a Glance

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.6 | Frontend framework (App Router) |
| React | 19 | UI rendering |
| Tailwind CSS | 4 | Styling |
| Zod | 4 | Schema validation |
| NestJS | — | Backend API (runs on port 3002) |
| JWT | — | Auth tokens (access + refresh) |
| httpOnly Cookies | — | Secure token storage |

---

## Architecture Overview

```
BROWSER
  │
  │  Every request passes through here first
  ▼
proxy.ts  (Next.js edge middleware — route guard)
  │
  ├─ Public route?  → render login page
  ├─ Valid token?   → render requested page
  ├─ Expired token? → silent refresh → render page
  └─ No token?      → redirect to /login
  │
  ▼
Next.js Server  (renders HTML, runs Server Actions)
  │
  ▼
NestJS Backend  (REST API on http://localhost:3002)
```

### Layer Map

| Layer | File | Where it runs | Responsibility |
|---|---|---|---|
| Route guard | `src/proxy.ts` | Server (every request, before page) | Auth gating, silent refresh |
| Login page | `src/app/(auth)/login/page.tsx` | Server | Renders the page shell |
| Login form | `src/app/(auth)/login/_components/LoginForm.tsx` | Browser | 2-step UI, client validation |
| Login actions | `src/app/(auth)/login/_actions/login.action.ts` | Server | Zod validation, API calls, cookie writing |
| Auth API | `src/lib/auth/auth.api.ts` | Server | Raw fetch calls to NestJS |
| Session | `src/lib/auth/session.ts` | Server | Read/write httpOnly cookies |
| Dashboard layout | `src/app/(dashboard)/layout.tsx` | Server | Wrap all dashboard pages |
| Sidebar / Header | `src/app/(dashboard)/_components/` | Browser | Interactive nav |
| Logout action | `src/app/(dashboard)/_actions/logout.action.ts` | Server | Clear cookies, redirect |

---

## What is a Server Component vs Client Component?

This project uses Next.js **App Router** which has two kinds of React components:

### Server Component (default)

- Runs **only on the server** — never in the browser
- Can read cookies, call databases, fetch from APIs directly
- Outputs HTML that is sent to the browser
- Cannot use `useState`, `useEffect`, or browser events
- Example: `layout.tsx`, `page.tsx`

### Client Component (`'use client'` at top of file)

- Runs **in the browser** after hydration
- Can use `useState`, `useEffect`, event handlers
- Cannot read server-only cookies or call server-only code directly
- Calls the server via **Server Actions**
- Example: `LoginForm.tsx`, `Sidebar.tsx`, `Header.tsx`

```
page.tsx (Server Component)
  └─ renders <LoginForm /> (Client Component)
               │
               │ user interaction triggers
               ▼
         checkEmailAction()  ← Server Action (runs on server)
               │
               ▼
         NestJS API
```

---

## What is a Server Action?

A Server Action is a function marked with `'use server'` that:

- **Lives in** `_actions/*.action.ts` files
- **Runs on the server** even when called from a Client Component
- The browser secretly POSTs to `/_next/action` (Next.js internal endpoint)
- The result is serialized and sent back to the browser

```
// In the browser (LoginForm.tsx)
const result = await checkEmailAction(email)

// This call leaves the browser and executes here:
// src/app/(auth)/login/_actions/login.action.ts (on the server)
```

This means Server Actions can safely read environment variables, call NestJS, write cookies — all without exposing secrets to the browser.

---

## Layer 0 — Route Guard: `proxy.ts`

`proxy.ts` runs on **every single request** before any page loads. It is Next.js middleware (renamed from `middleware.ts` in Next.js 16).

### What it does

```
Browser → Any URL
               ↓
          proxy.ts (runs first, always)
               ↓
     Read cookies: hrm_at (access token), hrm_rt (refresh token)
               ↓
     ┌─────────────────────────────────────────────────────────┐
     │                    Decision Tree                        │
     │                                                         │
     │  Is hrm_at present and NOT expired?                     │
     │    YES + protected route → NextResponse.next()          │
     │         (allow through, page loads normally)            │
     │    YES + public route   → redirect to /dashboard        │
     │         (already logged in, no need to see login)       │
     │                                                         │
     │  Is hrm_at expired but hrm_rt exists?                   │
     │    → call NestJS: POST /api/v1/auth/refresh             │
     │    → Success: set new cookies, allow through            │
     │    → Failure: clear cookies, redirect to /login         │
     │                                                         │
     │  No tokens at all?                                      │
     │    Public route  → allow through                        │
     │    Protected     → redirect to /login?callbackUrl=...   │
     └─────────────────────────────────────────────────────────┘
```

### How JWT expiry is checked (no library needed)

A JWT token looks like: `xxxxx.PAYLOAD.zzzzz`

The middle part (payload) is base64-encoded JSON. `proxy.ts` decodes it manually:

```
token.split('.')[1]           → base64 payload
atob(base64)                  → JSON string
JSON.parse(...)               → { sub, email, exp, iat, ... }
exp * 1000                    → expiry in milliseconds
exp * 1000 < Date.now() + 30s → true = expired (30s buffer avoids race conditions)
```

No `jose`, no `jsonwebtoken` library — zero dependencies.

### Public routes (no auth required)

```
/login
/forgot-password
/reset-password
```

Everything else requires a valid token.

---

## Layer 1 — Login Page Renders

```
Browser → GET /login
               ↓
          proxy.ts
            → no hrm_at cookie
            → /login is a public route
            → NextResponse.next()  (allow through)
               ↓
          Next.js App Router
               ↓
          src/app/(auth)/layout.tsx         (Server Component — wraps auth pages)
               ↓
          src/app/(auth)/login/page.tsx     (Server Component)
            → reads ?callbackUrl from search params
            → renders the split-screen layout (dark left + white right)
            → renders <LoginForm callbackUrl={callbackUrl} />
               ↓
          HTML is streamed to the browser
               ↓
          React hydrates LoginForm  (becomes interactive)
            → useState, useTransition, useRef now active
            → user sees the email input, ready to type
```

### What "hydration" means

The server sends static HTML (fast first paint). React then "attaches" event handlers to that HTML in the browser — this is hydration. After hydration, the form is fully interactive.

---

## Layer 2 — Step 1: Email Check

### In the browser (`LoginForm.tsx`)

```
User types email address
  │
  ├─ onChange fires → setEmail(value), setError('')
  └─ onBlur fires  → setEmailTouched(true)
                          │
                          ▼
                    Client validation runs:
                    - email is empty?          → "Email is required."
                    - email fails regex?        → "Enter a valid email address."
                    - shows error below input

User clicks "Continue" button
  │
  ▼
handleEmailSubmit(event) called
  │
  ├─ event.preventDefault()  → stop browser form submit
  ├─ setEmailTouched(true)   → trigger inline validation display
  │
  └─ Client check: email format valid?
       NO  → stop here, error shown, no network call
       YES → startTransition(async () => { ... })
               │
               │  useTransition keeps UI responsive during async work
               │  isPending = true → button shows spinner
               ▼
         checkEmailAction(email)   ← crosses the network (Server Action)
```

### On the server (`login.action.ts` → `auth.api.ts`)

```
checkEmailAction("user@company.com") called
  │
  ▼
Zod: z.email().safeParse(email)
  → invalid? → return { ok: false, error: "Please enter a valid email address." }
  → valid?   → continue
  │
  ▼
checkEmailApi(email)
  │
  fetch → POST http://localhost:3002/api/v1/auth/check-email
          headers: { Content-Type: application/json }
          body:    { "email": "user@company.com" }
          cache:   no-store  (never cache auth requests)
  │
  ▼
NestJS responds:
  {
    "success": true,
    "statusCode": 200,
    "message": "OK",
    "data": { "exists": true },
    "timestamp": "..."
  }
  │
  ▼
auth.api.ts unwraps envelope → returns { exists: true }
  │
  ▼
exists === false? → return { ok: false, error: "No account found with that email." }
exists === true?  → return { ok: true }
```

### Back in the browser

```
result = { ok: true }
  │
  ▼
setStep('password')
  │
  ▼
CSS transition:
  Step 1 div: opacity 1→0, translateX 0→-8px  (slides out left)
  Step 2 div: opacity 0→1, translateX +8px→0  (slides in right)
  Duration: 300ms ease-in-out
  │
  ▼
useEffect: step === 'password' → passwordRef.current.focus()
  │
  ▼
User now sees: email chip (with avatar initial) + password input
```

---

## Layer 3 — Step 2: Password & Sign In

### Browser: password form (`LoginForm.tsx`)

```
User types password
  │
  ├─ onChange → setPassword(value), setError('')
  └─ onBlur  → setPasswordTouched(true)
                    │
                    ▼
              Client validation:
              - empty?         → "Password is required."
              - length < 6?    → "Password must be at least 6 characters."

User clicks "Sign in"
  │
  ▼
handlePasswordSubmit(event) called
  │
  ├─ event.preventDefault()
  ├─ setPasswordTouched(true)
  │
  └─ Client check: password.length >= 6?
       NO  → stop, show error
       YES → startTransition(async () => { ... })
               │
               ▼
         loginAction(email, password, callbackUrl)  ← Server Action
```

### On the server (`login.action.ts`) — 3 sequential steps

```
loginAction("user@company.com", "secret123", "/dashboard") called
  │
  ▼
[VALIDATE]
  Zod: z.string().min(6).safeParse(password)
    → invalid? → return { ok: false, error: "Password must be at least 6 characters." }
    → valid?   → continue
  │
  ▼
[A] loginApi(email, password)
  │
  fetch → POST http://localhost:3002/api/v1/auth/login
          body: { "email": "user@company.com", "password": "secret123" }
  │
  NestJS validates credentials, signs JWT tokens, responds:
  {
    "success": true,
    "data": {
      "accessToken":  "eyJhbGciOiJIUzI1NiJ9...",   // expires in 1 day
      "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."    // expires in 30 days
    }
  }
  │
  → returns { accessToken, refreshToken }
  │
  ▼
[B] getMeApi(accessToken)
  │
  fetch → GET http://localhost:3002/api/v1/auth/me
          headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9..." }
  │
  NestJS decodes the token, looks up the user, responds:
  {
    "success": true,
    "data": {
      "id": "uuid-123",
      "email": "user@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-06-05T10:00:00.000Z",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  │
  → returns the user object
  │
  ▼
[C] setAuthCookies(tokens, user)   ← src/lib/auth/session.ts
  │
  Sets 3 cookies on the HTTP response header:
  │
  ├─ hrm_at   = accessToken   (httpOnly=true,  maxAge=86400s  = 1 day)
  ├─ hrm_rt   = refreshToken  (httpOnly=true,  maxAge=2592000s = 30 days)
  └─ hrm_user = JSON.stringify(user)  (httpOnly=false, maxAge=2592000s)
  │
  httpOnly=true  → JavaScript in the browser CANNOT read this cookie
                   (prevents XSS token theft)
  httpOnly=false → JavaScript CAN read hrm_user for displaying name/role
                   (no sensitive data in this cookie)
  │
  ▼
redirect('/dashboard')
  │
  Next.js throws a special NEXT_REDIRECT error internally
  Browser receives HTTP 302 Found with Location: /dashboard
  Browser automatically follows the redirect
```

### Browser: after loginAction resolves

```
loginAction() never returned { ok: false }
  → the transition completes with no error
  → browser follows the 302 redirect
  → new GET /dashboard request starts (with cookies now set)
```

---

## Layer 4 — Dashboard Loads

```
Browser → GET /dashboard
  │  (cookies: hrm_at, hrm_rt, hrm_user are all set)
  │
  ▼
proxy.ts
  → reads hrm_at cookie
  → decodes JWT payload: { exp: 1749168000, sub: "uuid-123", ... }
  → exp * 1000 > Date.now() + 30s → NOT expired
  → NextResponse.next()  (allow through)
  │
  ▼
Next.js App Router
  │
  ▼
src/app/(dashboard)/layout.tsx  (Server Component)
  │
  ├─ getSessionUser()
  │    → reads hrm_user cookie (JSON string)
  │    → JSON.parse() → AuthUser object
  │    → { id, email, firstName, lastName, role, ... }
  │
  ├─ renders layout shell:
  │    <div className="flex h-screen overflow-hidden bg-gray-50">
  │      <Sidebar user={user} />        ← 'use client'
  │      <div className="flex flex-1 flex-col">
  │        <Header user={user} />       ← 'use client'
  │        <main>{children}</main>
  │        <Footer />                   ← Server Component
  │      </div>
  │    </div>
  │
  ▼
children = src/app/(dashboard)/dashboard/page.tsx  (Server Component)
  │
  ├─ Greeting: "Good morning, John" (based on current hour)
  ├─ Stats grid: Total Employees (248), Active (186), On Leave (14), Open Positions (7)
  ├─ Quick Actions: Add Employee, Run Payroll, Schedule Review, Generate Report
  ├─ Recent Activity: list of mock recent HR events
  └─ Department chart: headcount bars per department
  │
  ▼
Full HTML streamed to browser
  │
  ▼
React hydrates Sidebar and Header (Client Components become interactive):
  - Sidebar: usePathname() highlights active nav link
  - Header: notification dropdown, user menu dropdown, search bar
```

---

## Layer 5 — Silent Token Refresh

The access token (`hrm_at`) expires after **1 day**. The refresh token (`hrm_rt`) lasts **30 days**. When the access token expires, `proxy.ts` handles it invisibly.

```
Scenario: user logged in yesterday, comes back today

Browser → GET /employees
  │
  ▼
proxy.ts
  → reads hrm_at cookie
  → decodes JWT → exp * 1000 = yesterday → EXPIRED
  → reads hrm_rt cookie → exists!
  │
  ▼
silentRefresh(refreshToken) called:
  │
  fetch → POST http://localhost:3002/api/v1/auth/refresh
          body: { "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
  │
  NestJS validates the refresh token, issues new tokens:
  {
    "success": true,
    "data": {
      "accessToken":  "new-access-token...",
      "refreshToken": "new-refresh-token..."
    }
  }
  │
  ▼
setTokenCookies(response, newTokens)
  → hrm_at  = new accessToken  (maxAge reset to 1 day)
  → hrm_rt  = new refreshToken (maxAge reset to 30 days)
  │
  ▼
NextResponse.next()  (allow request through with new cookies on the response)
  │
  ▼
/employees page loads normally — user sees nothing unusual
```

### What if the refresh token is also expired?

```
silentRefresh() → NestJS returns 401
  │
  ▼
clearTokenCookies()  → delete hrm_at, hrm_rt, hrm_user
  │
  ▼
redirect('/login?callbackUrl=/employees')
  │
  ▼
User sees login page
After login → redirect('/employees')  ← callbackUrl is preserved
```

---

## Layer 6 — Logout

```
User clicks "Sign out" (in Sidebar user card or Header user dropdown)
  │
  ▼
logoutAction() Server Action called  (src/app/(dashboard)/_actions/logout.action.ts)
  │
  ▼
[A] logoutApi(accessToken)  ← best-effort, errors silently ignored
  │
  fetch → POST http://localhost:3002/api/v1/auth/logout
          headers: { Authorization: "Bearer <accessToken>" }
  │
  NestJS invalidates the token server-side (blacklists it)
  Even if this fails (network error, token already expired), we proceed
  │
  ▼
[B] clearAuthCookies()  ← src/lib/auth/session.ts
  │
  Deletes all 3 cookies from the browser:
  - hrm_at   → deleted
  - hrm_rt   → deleted
  - hrm_user → deleted
  │
  ▼
[C] redirect('/login')
  │
  ▼
Browser → GET /login
  proxy.ts → no cookies → public route → allow through
  Login page renders fresh, all state cleared
```

---

## Error Handling

### Client-side (before any network call)

| Condition | Where caught | What user sees |
|---|---|---|
| Empty email | `handleEmailSubmit` | "Email is required." below input |
| Invalid email format | `handleEmailSubmit` | "Enter a valid email address." |
| Empty password | `handlePasswordSubmit` | "Password is required." |
| Password too short | `handlePasswordSubmit` | "Password must be at least 6 characters." |

### Server-side (after network call)

| Condition | Where caught | What user sees |
|---|---|---|
| Email not in system | `checkEmailAction` | "No account found with that email address." |
| NestJS unreachable | `checkEmailAction` | "Unable to verify email. Please try again." |
| Wrong password | `loginAction` | NestJS error message (e.g. "Invalid credentials") |
| Account inactive | `loginAction` | NestJS error message |
| NestJS unreachable | `loginAction` | "Incorrect password. Please try again." |

### Error propagation path

```
NestJS returns error response:
  { "success": false, "statusCode": 401, "message": "Invalid credentials" }
  │
  ▼
auth.api.ts call() function:
  → res.ok === false OR json.success === false
  → throw new Error(json.message)   ← throws with NestJS message
  │
  ▼
login.action.ts loginAction():
  → catch (err)
  → return { ok: false, error: err.message }   ← returns to browser
  │
  ▼
LoginForm.tsx:
  → result.ok === false
  → setError(result.error)   ← displayed in <FormError /> component
  │
  ▼
User sees red error banner above the form
```

---

## Cookie Reference

| Cookie | Value | httpOnly | Expiry | Purpose |
|---|---|---|---|---|
| `hrm_at` | JWT access token string | **Yes** | 1 day | Sent on every request; `proxy.ts` validates this |
| `hrm_rt` | JWT refresh token string | **Yes** | 30 days | Used by `proxy.ts` to get a new `hrm_at` when expired |
| `hrm_user` | JSON-stringified user object | No | 30 days | Read by client JS to show name, role, avatar initial |

**Why httpOnly for tokens?**

- JavaScript (including malicious scripts from XSS attacks) cannot read `httpOnly` cookies
- Tokens are only ever sent automatically by the browser in request headers — never exposed to JS

**Why NOT httpOnly for `hrm_user`?**

- The user object contains no sensitive data (no passwords, no tokens)
- It needs to be readable by the browser to show "Hello John" in the UI without an extra API call

---

## NestJS API Response Shape

Every response from NestJS is wrapped in this envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": { ... },
  "timestamp": "2026-06-05T10:00:00.000Z"
}
```

On failure:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-06-05T10:00:00.000Z"
}
```

`src/lib/auth/auth.api.ts` handles this for every call:

```
fetch response received
  │
  ├─ res.ok && json.success === true  → return json.data  (unwrapped)
  └─ else                             → throw new Error(json.message)
```

Callers never deal with the envelope — they just receive the data or catch an error.

---

## File Responsibility Map

```
src/
├── proxy.ts                              ← runs before EVERY request
│
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                    ← wraps all /login, /forgot-password pages
│   │   └── login/
│   │       ├── page.tsx                  ← renders the login split-screen shell
│   │       ├── _actions/
│   │       │   └── login.action.ts       ← checkEmailAction, loginAction (server-only)
│   │       └── _components/
│   │           └── LoginForm.tsx         ← 2-step form UI (browser)
│   │
│   └── (dashboard)/
│       ├── layout.tsx                    ← wraps all dashboard pages
│       ├── _actions/
│       │   └── logout.action.ts          ← logoutAction (server-only)
│       ├── _components/
│       │   ├── Sidebar.tsx               ← nav, mobile drawer (browser)
│       │   ├── Header.tsx                ← search, notifications, user menu (browser)
│       │   └── Footer.tsx                ← status, links (server)
│       └── dashboard/
│           └── page.tsx                  ← main dashboard page
│
├── lib/
│   ├── api.types.ts                      ← ApiResponse<T>, ActionState types
│   ├── auth/
│   │   ├── types.ts                      ← AuthUser, AuthTokens, UserRole types
│   │   ├── auth.api.ts                   ← raw fetch calls to NestJS endpoints
│   │   └── session.ts                    ← read/write/clear httpOnly cookies
│   └── http/
│       └── client.ts                     ← generic authenticated fetch wrapper
│
└── components/
    └── ui/
        ├── Button.tsx                    ← shared button with loading spinner
        ├── FormError.tsx                 ← red error banner component
        └── Input.tsx                     ← shared input field
```

---

## Full Visual Diagram

```
BROWSER                      NEXT.JS SERVER                  NESTJS BACKEND
   │                               │                               │
   │ ── GET /login ──────────────► │                               │
   │                         proxy.ts                              │
   │                         no token + public route               │
   │                         → NextResponse.next()                 │
   │                               │                               │
   │                         login/page.tsx renders                │
   │                         <LoginForm /> hydrates                │
   │ ◄── HTML (login page) ──────── │                               │
   │                               │                               │
   │ ── [Step 1] Enter email ─────► │                               │
   │    checkEmailAction()          │ ── POST /check-email ───────► │
   │    (Server Action via RPC)     │                         validates email
   │                               │ ◄── { exists: true } ──────── │
   │                         return { ok: true }                   │
   │ ◄── { ok: true } ──────────── │                               │
   │    CSS slide to Step 2         │                               │
   │                               │                               │
   │ ── [Step 2] Enter password ──► │                               │
   │    loginAction()               │ ── POST /login ─────────────► │
   │    (Server Action via RPC)     │               { email, pass } │
   │                               │ ◄── { accessToken, rt } ───── │
   │                               │ ── GET /me (Bearer token) ──► │
   │                               │ ◄── { user object } ────────── │
   │                         setAuthCookies()                      │
   │                         set hrm_at, hrm_rt, hrm_user          │
   │ ◄── 302 /dashboard ─────────── │                               │
   │                               │                               │
   │ ── GET /dashboard ───────────► │                               │
   │                         proxy.ts                              │
   │                         hrm_at valid → NextResponse.next()    │
   │                         layout.tsx → getSessionUser()         │
   │                         render Sidebar, Header, page          │
   │ ◄── HTML (dashboard) ────────── │                               │
   │                               │                               │
   │ ── GET /employees (day later) ► │                               │
   │                         proxy.ts                              │
   │                         hrm_at EXPIRED                        │
   │                         hrm_rt exists → silentRefresh()       │
   │                               │ ── POST /refresh ───────────► │
   │                               │ ◄── new tokens ─────────────── │
   │                         set new hrm_at, hrm_rt cookies        │
   │                         → NextResponse.next()                 │
   │ ◄── HTML (/employees) ──────── │                               │
   │                               │                               │
   │ ── [Logout] click Sign out ──► │                               │
   │    logoutAction()              │ ── POST /logout (best-effort) ► │
   │                         clearAuthCookies()                    │
   │                         delete hrm_at, hrm_rt, hrm_user       │
   │ ◄── 302 /login ─────────────── │                               │
```
