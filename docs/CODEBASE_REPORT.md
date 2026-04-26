# SmartSupplyChain – Detailed Codebase Report

> **Generated:** 2026-04-26  
> **Author:** Antigravity (AI Code Assistant)  
> **Project Path:** `d:\Downloads\New folder\supplyChain`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Configuration Files](#4-configuration-files)
5. [Application Architecture](#5-application-architecture)
6. [Feature Breakdown — Auth](#6-feature-breakdown--auth)
   - [Pages](#61-pages)
   - [API Service Layer](#62-api-service-layer)
   - [State Management (Redux)](#63-state-management-redux)
   - [Custom Hook](#64-custom-hook)
7. [Data Flow Diagram](#7-data-flow-diagram)
8. [Backend Integration](#8-backend-integration)
9. [Test Scripts](#9-test-scripts)
10. [Known Issues & Technical Debt](#10-known-issues--technical-debt)
11. [Improvement Recommendations](#11-improvement-recommendations)

---

## 1. Project Overview

**SmartSupplyChain** is a React-based frontend application designed to serve as the user-facing interface for a delivery routing and supply chain management system. The app communicates with a live backend deployed at:

```
https://delivery-routing-system.onrender.com
```

At its current state, the application implements the **authentication layer only** — user registration and login — built with a clean feature-first folder architecture and wired to a Redux global state store. The project is scaffolded with Vite and styled with Tailwind CSS v4.

---

## 2. Tech Stack

| Category | Technology | Version |
|---|---|---|
| UI Framework | React | ^19.2.5 |
| Language | JavaScript (JSX) | ES Modules |
| Build Tool | Vite | ^8.0.10 |
| Routing | React Router DOM | ^7.14.2 |
| State Management | Redux Toolkit | ^2.11.2 |
| React-Redux binding | react-redux | ^9.2.0 |
| HTTP Client | Axios | ^1.15.2 |
| Styling | Tailwind CSS v4 | ^4.2.4 |
| Linting | ESLint | ^10.2.1 |
| Type Definitions | @types/react | ^19.2.14 |

> **Note:** Tailwind CSS v4 is integrated via `@tailwindcss/vite` Vite plugin (not PostCSS), which is the v4-native approach.

---

## 3. Project Structure

```
supplyChain/
├── index.html                     # HTML entry point
├── vite.config.js                 # Vite + plugins config
├── eslint.config.js               # ESLint flat config (v9+)
├── package.json                   # Dependencies & npm scripts
├── package-lock.json              # Lockfile
├── test-login.js                  # Manual API test: login endpoint
├── test-signup.js                 # Manual API test: signup endpoint
├── public/                        # Static assets (favicon.svg etc.)
└── src/
    ├── main.jsx                   # React DOM entry – mounts <App />
    ├── app/
    │   ├── App.jsx                # Root component (Provider + Router + Routes)
    │   ├── App.css                # Global CSS (Tailwind @import)
    │   ├── app.routes.jsx         # Secondary router definition (unused)
    │   └── app.store.js           # Redux store configuration
    └── features/
        └── auth/
            ├── pages/
            │   ├── Login.jsx      # Login form page
            │   └── Register.jsx   # Registration form page
            ├── service/
            │   └── auth.api.js    # Axios API calls to backend
            ├── state/
            │   └── auth.slice.js  # Redux slice for auth state
            └── hook/
                └── useAuth.js     # Custom hook orchestrating dispatch + API
```

### Architecture Pattern
The project follows a **Feature-Sliced Design (FSD)** -inspired structure where each domain feature (`auth`) is self-contained with its own `pages/`, `service/`, `state/`, and `hook/` subdirectories. This scales cleanly as more features (e.g., `orders`, `inventory`, `delivery`) are added.

---

## 4. Configuration Files

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
- Uses the official Vite React plugin for JSX transform + Fast Refresh.
- Tailwind CSS v4 is loaded as a Vite plugin (no `tailwind.config.js` needed).
- No dev proxy configured — all API requests go directly to the remote backend URL.

### `eslint.config.js`
- Uses ESLint's **flat config** format (v9+ style via `defineConfig`).
- Plugins: `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.
- Targets all `*.js` and `*.jsx` files.

### `App.css`
```css
@import "tailwindcss";
```
- Tailwind v4's single-import syntax instead of v3's `@tailwind base/components/utilities` directives.

### `index.html`
- Standard Vite SPA entry. Mounts the app inside `<div id="root">`.
- No Open Graph tags, no meaningful `<title>` beyond `supplychain`.

---

## 5. Application Architecture

### Entry Point (`src/main.jsx`)
```
ReactDOM.createRoot → <React.StrictMode> → <App />
```

### Root Component (`src/app/App.jsx`)

Wraps the entire app with:
1. **`<Provider store={store}>`** — Makes the Redux store available globally.
2. **`<BrowserRouter>`** — Enables client-side routing.
3. **`<Routes>`** — Declares three routes:

| Path | Component |
|---|---|
| `/` | `<h1>Home</h1>` (placeholder) |
| `/register` | `<Register />` |
| `/login` | `<Login />` |

> **⚠ Note:** `app.routes.jsx` defines a separate `createBrowserRouter` configuration that maps `/` → `<Login />` and `/register` → `<Register />`. This file is **imported but never used** — it is dead code. The actual routing is handled inline inside `App.jsx`.

### Redux Store (`src/app/app.store.js`)
```js
configureStore({
  reducer: {
    auth: authReducer,
  },
})
```
Single reducer registered: `auth`. No middleware customisation.

---

## 6. Feature Breakdown — Auth

### 6.1 Pages

#### `Login.jsx`
- Local state: `{ username, password }` via `useState`.
- On submit: calls `handleLogin({ username, password })` from `useAuth`.
- On success: navigates to `/` via `useNavigate`.
- UI: Tailwind-styled card with username/password inputs, a "Remember me" checkbox (purely cosmetic — value not used), a "Forgot your password?" link (href `#`, non-functional), a **Sign in** button, and a **Logout** button.

> **⚠ Issue:** The **Logout** button is rendered directly on the Login page, which is semantically incorrect. Logout should only appear in an authenticated context (e.g., a nav bar or dashboard).

#### `Register.jsx`
- Local state: `{ username, email, password, role, work_location, address }` via `useState`.
- On submit: calls `handleRegister(formData)` from `useAuth`.
- No post-registration redirect (no `useNavigate` call).
- UI: Tailwind-styled card with:
  - `username` text input
  - `email` email input
  - `password` password input
  - `role` select dropdown: `Manufacturer` | `Deliveryman` | `Warehouse employee`
  - `work_location` text input
  - `address` textarea (3 rows)

> **⚠ Issue:** No navigation after successful registration — the user stays on the Register page with no feedback.

---

### 6.2 API Service Layer

**File:** `src/features/auth/service/auth.api.js`

A single shared Axios instance is created:
```js
const authApiInstance = axios.create({
    baseURL: "https://delivery-routing-system.onrender.com",
    withCredentials: true,   // Sends cookies on every request
})
```

#### `register({ username, password, email, role, work_location, address })`
- **Method:** `POST /user/Signup`
- **Content-Type:** `application/json` (Axios default)
- **Payload:** Full user object including `work_location` and `address`.
- **Returns:** `response.data`

#### `login({ username, password })`
- **Method:** `POST /user/Login`
- **Content-Type:** `application/x-www-form-urlencoded`
- Uses `URLSearchParams` to encode credentials as a form body.
- **Returns:** `response.data`

> **ℹ Note:** Login uses form-encoded body while signup uses JSON. This matches backend requirements (FastAPI's OAuth2PasswordRequestForm expects form data for login).

#### `logout()`
- **Method:** `POST /user/Logout`
- Sends an empty body `{}` with `withCredentials: true`.
- **Returns:** A hardcoded local object `{ message, success, user: null }` regardless of actual backend response. The backend response is ignored.

---

### 6.3 State Management (Redux)

**File:** `src/features/auth/state/auth.slice.js`

```
Slice name: "auth"
```

| State Key | Type | Initial Value | Purpose |
|---|---|---|---|
| `user` | object \| null | `null` | Authenticated user object from backend |
| `loading` | boolean | `false` | Tracks in-flight API requests |
| `error` | string \| null | `null` | Stores error messages from failed calls |
| `initialized` | boolean | `false` | Intended for app init check (unused currently) |

| Action | Payload | Effect |
|---|---|---|
| `setUser(payload)` | user object or null | Sets `state.user` |
| `setLoading(payload)` | boolean | Sets `state.loading` |
| `setError(payload)` | string or null | Sets `state.error` |
| `setInitialized(payload)` | boolean | Sets `state.initialized` |

> **⚠ Issue:** `setInitialized` is exported from the slice but is **never dispatched anywhere** in the codebase. It was likely intended to mark when an initial auth check (e.g., validate session on app load) completes.

---

### 6.4 Custom Hook

**File:** `src/features/auth/hook/useAuth.js`

Encapsulates all auth operations as a composable hook. Internally uses `useDispatch` and calls the API service functions.

```
useAuth() returns:
  ├── handleRegister({ username, password, email, role, work_location, address })
  ├── handleLogin({ username, password })
  └── handleLogout()
```

**Control flow for each handler:**
1. `dispatch(setLoading(true))`
2. `await` the API call
3. On success: `dispatch(setUser(response.user))`, `dispatch(setLoading(false))`
4. On error: `dispatch(setLoading(false))`, `dispatch(setError(error.message))`, `throw error`

> **⚠ Issue:** The `error` state is never cleared between operations. A prior login error will persist in Redux state even after a subsequent successful operation unless explicitly reset.

---

## 7. Data Flow Diagram

```
User Interaction (Form Submit)
        │
        ▼
   Page Component (Login.jsx / Register.jsx)
        │  calls
        ▼
   useAuth hook (useAuth.js)
        │  dispatch(setLoading(true))
        │  calls
        ▼
   API Service (auth.api.js → Axios)
        │
        ▼
   Backend (delivery-routing-system.onrender.com)
        │
        ▼
   Response
        │
   ┌────┴────┐
   │         │
Success    Failure
   │         │
dispatch   dispatch
setUser    setError
setLoading setLoading
(false)    (false)
   │         │
   └────┬────┘
        ▼
  Redux Store (auth slice)
        │
        ▼
  Component re-render (via useSelector — not yet implemented in pages)
```

> **ℹ Note:** Pages currently do **not** use `useSelector` to read Redux state (e.g., display loading spinners or error messages). The Redux state is written but never read back in the UI.

---

## 8. Backend Integration

| Endpoint | Method | Content-Type | Notes |
|---|---|---|---|
| `/user/Signup` | POST | application/json | User registration |
| `/user/Login` | POST | application/x-www-form-urlencoded | OAuth2 form login |
| `/user/Logout` | POST | application/json | Session termination |

- **Base URL:** `https://delivery-routing-system.onrender.com`
- **Auth mechanism:** Cookie-based sessions (`withCredentials: true`)
- **CORS:** Must be configured on the backend to allow the Vite dev server origin (`localhost:5173`).

### User Roles (from Register.jsx select)
| Role Value (sent to API) | Display Label |
|---|---|
| `Manufacturer` | Manufacturer |
| `Deliveryman` | Deliveryman |
| `Warehouse employee` | Warehouse employee |

---

## 9. Test Scripts

Two standalone Node.js test scripts exist at the project root for manual API verification (not part of the frontend bundle).

### `test-login.js`
Tests both JSON and form-encoded login payloads against the live backend.
- `testJson()` — sends login as `application/json` (expected to fail if backend requires form data)
- `testForm()` — sends login as `application/x-www-form-urlencoded` (the correct format)

### `test-signup.js`
Tests signup with multiple roles:
- `Deliveryman`, `Warehouse employee`, `admin`
- Generates unique usernames using `Date.now()` to avoid conflicts.

> **Run with:** `node test-login.js` / `node test-signup.js` (requires `axios` to be installed)

---

## 10. Known Issues & Technical Debt

| # | Severity | Location | Description |
|---|---|---|---|
| 1 | 🔴 High | `App.jsx` | `/` route renders a bare `<h1>Home</h1>` — no actual home/dashboard page exists |
| 2 | 🔴 High | `Login.jsx` | **Logout button on Login page** — semantically wrong; should be in an authenticated layout |
| 3 | 🔴 High | `Register.jsx` | **No redirect after registration** — user gets no feedback or navigation on success |
| 4 | 🟠 Medium | `useAuth.js` | **Error state never cleared** — stale errors persist across operations |
| 5 | 🟠 Medium | `Login.jsx` / `Register.jsx` | **Redux state not consumed** — `loading` and `error` from the store are never read; no loading spinners or error messages shown |
| 6 | 🟠 Medium | `app.routes.jsx` | **Dead file** — defines a router that is never used; creates confusion |
| 7 | 🟠 Medium | `auth.slice.js` | `initialized` state and `setInitialized` action are defined but never used — no session persistence check on app load |
| 8 | 🟡 Low | `Login.jsx` | "Remember me" checkbox is rendered but its value is never read or acted upon |
| 9 | 🟡 Low | `Login.jsx` | "Forgot your password?" link points to `#` — non-functional |
| 10 | 🟡 Low | `logout()` in `auth.api.js` | Backend response is ignored; hardcoded success object returned regardless of actual result |
| 11 | 🟡 Low | `index.html` | No meta description, no Open Graph tags, generic title |
| 12 | 🟡 Low | Project root | No environment variable support — API base URL is hardcoded in `auth.api.js` |

---

## 11. Improvement Recommendations

### High Priority

1. **Add a Protected Route wrapper** — Create a `PrivateRoute` component that checks `auth.user` in Redux and redirects unauthenticated users to `/login`.

2. **Session persistence on app load** — On app startup, call a `/user/me` or `/user/profile` endpoint and dispatch `setUser` + `setInitialized(true)` to restore sessions from cookies.

3. **Post-registration redirect** — After successful `handleRegister`, navigate to `/login` (or directly to the dashboard if auto-login is desired).

4. **Move Logout button** — Remove from `Login.jsx` and place in a nav bar or user menu visible only when authenticated.

### Medium Priority

5. **Consume Redux state in UI** — Add `useSelector` to read `auth.loading` and `auth.error`; show loading spinners on buttons and display error messages inline in forms.

6. **Clear error on new attempt** — Dispatch `setError(null)` at the start of each handler in `useAuth.js`.

7. **Delete `app.routes.jsx`** — The file is dead code and creates architectural confusion. Consolidate routing in `App.jsx`.

8. **Environment variables** — Move the backend base URL to `.env`:
   ```
   VITE_API_BASE_URL=https://delivery-routing-system.onrender.com
   ```
   Then reference it as `import.meta.env.VITE_API_BASE_URL` in `auth.api.js`.

### Low Priority / Future Work

9. **Add more features** — The current codebase only implements auth. The supply chain domain likely needs: `orders`, `inventory`, `delivery tracking`, `warehouse management` features — each following the same feature-sliced structure.

10. **Add a proper form validation library** — Consider `react-hook-form` + `zod` for robust client-side validation with better UX.

11. **Add toast notifications** — Libraries like `react-hot-toast` or `sonner` provide clean feedback for success/error states without inline JSX clutter.

12. **SEO improvements** — Add proper `<title>` per route, meta descriptions, and Open Graph tags in `index.html`.

13. **Global Axios error interceptor** — Centralise 401/403/500 handling in `auth.api.js` instead of per-call try/catch everywhere.

---

*End of Report*
