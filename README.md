# ApproTrack — multi-page build

The original `approtrack_full.html` was a single-page app where all views (landing, login, signup, dashboard, projects, etc.) lived in one file and were swapped via JavaScript. This build splits it into **9 real HTML pages** that share `styles.css`, `auth.js`, and `app.js`.

## Demo credentials

When you open `login.html` you'll see a highlighted box with the demo credentials and a "Use demo credentials" button that fills them in for you:

- **Email:** `demo@approtrack.ng`
- **Password:** `demo1234`

You can also sign up with any new email + an 8+ character password — that creates a fresh session with whatever plan you pick.

## File map

| File | Purpose |
|---|---|
| `index.html` | Landing / marketing page (public) |
| `login.html` | Log in (public) — has demo creds + "Use demo credentials" button |
| `signup.html` | Sign up (public) — pick Free or Pro plan |
| `dashboard.html` | Main dashboard (after login) |
| `projects.html` | All projects list |
| `documents.html` | Documents library |
| `clients.html` | Clients list |
| `reports.html` | Reports (gated to Pro plan) |
| `settings.html` | Profile / workspace / billing settings |
| `styles.css` | All styles (shared) |
| `auth.js` | Session management via localStorage (shared) |
| `app.js` | All app logic — sidebar nav, modals, search, project switcher, etc. (shared) |

## How auth works

1. `auth.js` exposes a small `window.ApproAuth` API: `attemptLogin`, `attemptSignup`, `getSession`, `clearSession`, `requireAuth`, `logout`.
2. Successful login or signup writes the user object to `localStorage` under `approtrack_session`, then redirects to `dashboard.html`.
3. Every protected page (`dashboard`, `projects`, `documents`, `clients`, `reports`, `settings`) calls `ApproAuth.requireAuth()` at the top of `<body>` — if no session, it redirects to `login.html`.
4. The "Sign out" item in the profile dropdown calls `ApproAuth.clearSession()` and sends the user to `index.html`.
5. If you visit `login.html` or `signup.html` while already logged in, you're auto-redirected to `dashboard.html`.

## How navigation works

Sidebar items are real `<a href="page.html">` links — no JavaScript routing tricks. The original `navigateTo(pageId)` function still exists in `app.js` but now does `window.location.href = ...`, so any internal call (project switcher, breadcrumb, "view all projects" etc.) navigates to the actual page.

## Running

This is a static site — open `index.html` directly in a browser (`file://`) or serve the folder with any static server, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

> Note: `localStorage` works fine over `file://` in modern browsers, so you don't strictly need an HTTP server, but a server is recommended.
