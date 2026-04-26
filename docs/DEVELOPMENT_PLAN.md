# SmartSupplyChain — Frontend Development Plan

> **Stack:** React 19 · Vite · Redux Toolkit · React Router DOM v7 · Tailwind CSS v4 · Axios  
> **Backend:** FastAPI at `https://delivery-routing-system.onrender.com`  
> **Auth Strategy:** JWT Bearer Token (stored in memory / localStorage)  
> **Reference UI:** Dashboard design (see attached image — sidebar nav, stat cards, consignment table, upcoming deliveries panel)

---

## Overview

| Phase | Focus Area | Sprints |
|---|---|---|
| Phase 0 | Foundation & Architecture Fixes | Sprint 0.1 |
| Phase 1 | Authentication & Session Management | Sprint 1.1 · 1.2 |
| Phase 2 | Core Layout & Navigation Shell | Sprint 2.1 |
| Phase 3 | Dashboard | Sprint 3.1 |
| Phase 4 | Consignments Module | Sprint 4.1 · 4.2 · 4.3 |
| Phase 5 | Routes Module | Sprint 5.1 |
| Phase 6 | Deliveries Module | Sprint 6.1 |
| Phase 7 | QR Scan Module | Sprint 7.1 |
| Phase 8 | Profile & Settings | Sprint 8.1 |
| Phase 9 | Polish, Error Handling & Performance | Sprint 9.1 · 9.2 |

---

## Phase 0 — Foundation & Architecture Fixes

> **Goal:** Clean up existing dead code, establish project conventions, and lay the infrastructure every other phase depends on.

### Sprint 0.1 — Project Cleanup & Infrastructure Setup

**Duration:** 1–2 days

#### Sub-tasks

- [ ] **0.1.1 — Delete dead file**  
  Remove `src/app/app.routes.jsx` (unused router definition conflicting with inline routes in `App.jsx`).

- [ ] **0.1.2 — Environment variables**  
  Create `.env` file with:
  ```
  VITE_API_BASE_URL=https://delivery-routing-system.onrender.com
  ```
  Update `auth.api.js` to use `import.meta.env.VITE_API_BASE_URL`.  
  Add `.env` to `.gitignore`.

- [ ] **0.1.3 — Centralised Axios instance**  
  Create `src/shared/api/axiosInstance.js`:
  - Reads base URL from env var
  - Attaches `Authorization: Bearer {token}` via request interceptor (reads from store/localStorage)
  - Global response interceptor for 401 → redirect to `/login`, 422 → normalise validation errors, 500 → generic error toast

- [ ] **0.1.4 — Token storage utility**  
  Create `src/shared/utils/token.js` with `getToken()`, `setToken(t)`, `removeToken()` helpers (wrapping localStorage).

- [ ] **0.1.5 — Shared Redux selectors**  
  Create `src/features/auth/state/auth.selectors.js` exporting:
  - `selectUser`
  - `selectAuthLoading`
  - `selectAuthError`
  - `selectIsAuthenticated`

- [ ] **0.1.6 — Toast notification setup**  
  Install and configure a toast library (e.g., `react-hot-toast`). Place `<Toaster />` once in `App.jsx`.

- [ ] **0.1.7 — Shared component scaffolding**  
  Create `src/shared/components/` directory for reusable UI atoms:
  - `Spinner.jsx` — loading spinner
  - `Button.jsx` — variant-aware button (primary / secondary / danger)
  - `StatusBadge.jsx` — coloured pill: pending / in-transit / delivered / delayed

- [ ] **0.1.8 — Global CSS design tokens**  
  In `App.css`, define CSS custom properties for the design system colours, spacing, and typography seen in the dashboard UI (light blue-grey background, white cards, sidebar dark tone, accent blue `#2563EB`).

---

## Phase 1 — Authentication & Session Management

> **Goal:** Fully working, production-grade auth with JWT handling, protected routes, and session persistence.

### Sprint 1.1 — Auth Fixes & JWT Integration

**Duration:** 2 days

**Backend contracts:**
- `POST /user/Login/` → `{ access_token, token_type }`
- `POST /user/Signup/` → `{ id, username, email, role }`
- `POST /user/logout/` (Bearer required)

#### Sub-tasks

- [ ] **1.1.1 — Fix Signup schema**  
  The backend Signup endpoint does **not** accept a `role` field in its request body (per schema). Remove the `role` select input from `Register.jsx` and from the `handleRegister` payload in `useAuth.js` and `auth.api.js`.

- [ ] **1.1.2 — JWT storage on login**  
  After `POST /user/Login/` returns `{ access_token }`:
  - Call `setToken(access_token)` from the token utility.
  - Store a decoded or profile-fetched user object in Redux `auth.user`.

- [ ] **1.1.3 — Fetch user profile after login**  
  After token is stored, call `GET /user/me` (or equivalent profile endpoint) to populate the user object in the Redux store (name, role, work_location etc.).  
  *(If no `/me` endpoint exists, derive user info from JWT payload using `atob` decode.)*

- [ ] **1.1.4 — Session persistence on app load**  
  In `App.jsx`, add a `useEffect` that runs once on mount:
  1. Check `getToken()` from localStorage.
  2. If token exists → set it in Axios interceptor → fetch user profile → `dispatch(setUser(...))` → `dispatch(setInitialized(true))`.
  3. If no token → `dispatch(setInitialized(true))` (unauthenticated).
  Show a full-screen loading spinner until `initialized === true`.

- [ ] **1.1.5 — Fix Logout**  
  - Call `POST /user/logout/` with Bearer token.
  - On success: `removeToken()`, `dispatch(setUser(null))`, navigate to `/login`.
  - Move logout trigger out of `Login.jsx`.

- [ ] **1.1.6 — Clear error state on new attempt**  
  Dispatch `setError(null)` at the start of every handler in `useAuth.js`.

- [ ] **1.1.7 — Show loading & error in Login/Register UI**  
  Use `useSelector(selectAuthLoading)` and `useSelector(selectAuthError)` to:
  - Disable the submit button and show a spinner while loading.
  - Display an inline error message below the form on failure.

- [ ] **1.1.8 — Post-registration redirect**  
  After successful `handleRegister`, `navigate('/login')` with a success toast.

### Sprint 1.2 — Protected Routes & Role Guards

**Duration:** 1 day

#### Sub-tasks

- [ ] **1.2.1 — PrivateRoute component**  
  Create `src/shared/components/PrivateRoute.jsx`:
  - Reads `selectIsAuthenticated` and `selectInitialized` from Redux.
  - While not initialized: renders `<Spinner />`.
  - If not authenticated: `<Navigate to="/login" replace />`.
  - If authenticated: renders `<Outlet />`.

- [ ] **1.2.2 — PublicRoute component**  
  Create `src/shared/components/PublicRoute.jsx`:
  - If already authenticated: `<Navigate to="/dashboard" replace />`.
  - Otherwise renders `<Outlet />`.
  - Prevents logged-in users from re-visiting `/login` or `/register`.

- [ ] **1.2.3 — Update App.jsx routing**  
  Restructure routes:
  ```
  /login        → PublicRoute → Login
  /register     → PublicRoute → Register
  /             → PrivateRoute → AppShell
    /dashboard  → Dashboard
    /consignments → Consignments
    /routes     → Routes
    /deliveries → Deliveries
    /qr-scan    → QRScan
    /profile    → Profile
    /settings   → Settings
  ```

---

## Phase 2 — Core Layout & Navigation Shell

> **Goal:** Build the persistent application shell that matches the reference dashboard UI — sidebar, top bar, breadcrumbs, and responsive layout.

### Sprint 2.1 — AppShell Layout Component

**Duration:** 2 days

**Reference UI elements:**
- Left sidebar: "Smart Supply / Chain Operations" logo, nav sections (Overview, Operations, Account), active state highlight
- Top bar: global search (⌘K shortcut), notification bell with badge, help icon, user avatar
- Main content area: breadcrumb trail, page title, action buttons (Export, + New Consignment)
- Bottom-left sidebar: user name, role, and "…" menu

#### Sub-tasks

- [ ] **2.1.1 — `AppShell.jsx` layout component**  
  Create `src/app/layouts/AppShell.jsx` using CSS Grid or Flexbox:
  - Fixed 200px sidebar on the left
  - Top bar at full width
  - Scrollable main content area

- [ ] **2.1.2 — `Sidebar.jsx` component**  
  Create `src/shared/components/Sidebar.jsx`:
  - Logo section at top
  - Navigation groups: **OVERVIEW** (Dashboard), **OPERATIONS** (Consignments with badge, Routes, Deliveries, QR Scan), **ACCOUNT** (Profile, Settings)
  - Active route highlighting via `useMatch` / `NavLink`
  - User info panel at the bottom (avatar, name, role, "…" menu)

- [ ] **2.1.3 — `TopBar.jsx` component**  
  Create `src/shared/components/TopBar.jsx`:
  - Search input (styled, keyboard shortcut hint ⌘K)
  - Notification bell with red dot badge
  - Help (?) icon button
  - User avatar circle (initials fallback)

- [ ] **2.1.4 — `PageHeader.jsx` component**  
  Reusable page header with:
  - Breadcrumb (e.g., "Smart Supply Chain / Dashboard")
  - `<h1>` page title
  - Subtitle (e.g., "Good morning, {name} — {date}")
  - Slot for action buttons (Export, + New)

- [ ] **2.1.5 — Responsive behaviour**  
  Sidebar collapses to icon-only on tablet width; hidden + hamburger menu on mobile.

---

## Phase 3 — Dashboard

> **Goal:** Build the overview dashboard page matching the reference UI — 4 stat cards, recent consignments table, upcoming deliveries panel.

### Sprint 3.1 — Dashboard Page

**Duration:** 2–3 days

**Backend calls:**
- `GET /consignment/all?limit=5&skip=0` — recent consignments list
- `GET /Deliveries` — upcoming deliveries
- Summary stats derived client-side from the consignment list (total, in-transit count, delayed count, delivered today count)

#### Sub-tasks

- [ ] **3.1.1 — Redux slice for consignments**  
  Create `src/features/consignments/state/consignment.slice.js`:
  - State: `{ items: [], total: 0, loading: false, error: null }`
  - Actions: `setConsignments`, `setConsignmentLoading`, `setConsignmentError`
  - Register in `app.store.js`

- [ ] **3.1.2 — Redux slice for deliveries**  
  Create `src/features/deliveries/state/delivery.slice.js`:
  - State: `{ items: [], loading: false, error: null }`
  - Register in `app.store.js`

- [ ] **3.1.3 — `StatCard.jsx` component**  
  Reusable card with: label, big number, trend indicator (↑/↓ with %, colour-coded green/orange/red), and a small sparkline SVG graphic.

- [ ] **3.1.4 — Dashboard stats logic**  
  A `useDashboardStats` hook that:
  - Fetches all consignments
  - Computes: `total`, `inTransit` (status === "in-transit"), `delayed` (custom logic), `deliveredToday`
  - Returns stats object

- [ ] **3.1.5 — `RecentConsignments` table component**  
  - Columns: ID, Customer, Route (origin pincode → dest pincode), Status badge, ETA
  - Tab filters: Active · Pending · Delayed with counts
  - "View all →" link to `/consignments`
  - Skeleton loading rows while fetching

- [ ] **3.1.6 — `UpcomingDeliveries` panel component**  
  - List of upcoming delivery cards: hub name, consignment ID, status badge, date/time
  - "View all →" link to `/deliveries`

- [ ] **3.1.7 — `Dashboard.jsx` page assembly**  
  Wire up stat cards, recent consignments, and upcoming deliveries. Set page title "Dashboard" with greeting + date in `PageHeader`.

---

## Phase 4 — Consignments Module

> **Goal:** Full CRUD for consignments — list view, detail view, create form, edit form, and image update.

### Sprint 4.1 — Consignments List & Detail

**Duration:** 2 days

**Backend calls:**
- `GET /consignment/all?limit={n}&skip={n}`
- `GET /consignment/{id}`
- `GET /consignment/by_name/{name}`

#### Sub-tasks

- [ ] **4.1.1 — `consignment.api.js` service**  
  Create `src/features/consignments/service/consignment.api.js` with:
  - `getAllConsignments({ limit, skip })`
  - `getConsignmentById(id)`
  - `getConsignmentByName(name)`

- [ ] **4.1.2 — `useConsignments` hook**  
  Orchestrates fetch → dispatch → loading/error state.

- [ ] **4.1.3 — `ConsignmentList.jsx` page**  
  - Data table with columns: Consignment ID, Product Type, Origin → Destination, Weight, Status, Created At, Actions
  - Status badges (pending=grey, in-transit=blue, delivered=green)
  - Pagination controls (limit/skip pattern)
  - Search bar (filter by name via `GET /consignment/by_name/{name}`)
  - Row click → navigates to detail page

- [ ] **4.1.4 — `ConsignmentDetail.jsx` page**  
  - Full consignment info card: all fields, QR code image, product image
  - "Get Optimal Path" button → triggers Route fetch (Phase 5)
  - Action buttons: Edit, Update Image, Scan QR

### Sprint 4.2 — Create & Edit Consignment

**Duration:** 2 days

**Backend calls:**
- `POST /consignment/create` (multipart/form-data)
- `PUT /consignment/update/{id}` (JSON)
- `PUT /consignment/image/{id}` (multipart/form-data)
- `GET /consignment/check_pincode/{pincode}`

#### Sub-tasks

- [ ] **4.2.1 — API methods for create/update**  
  Add `createConsignment(formData)`, `updateConsignment(id, data)`, `updateConsignmentImage(id, imageFile)` to `consignment.api.js`.

- [ ] **4.2.2 — Pincode validation helper**  
  On pincode field blur, call `GET /consignment/check_pincode/{pincode}` and show inline `valid ✓ {region}` or `✗ invalid pincode` feedback.

- [ ] **4.2.3 — `CreateConsignment.jsx` modal/page**  
  Form fields:
  - `origin_pincode` (6-digit, live validated)
  - `destination_pincode` (6-digit, live validated)
  - `product_type` (text)
  - `weight` (number, kg)
  - `image` (file upload, drag-and-drop, max 5MB, JPEG/PNG/WebP only, preview thumbnail)
  
  On submit: sends `multipart/form-data`. On success: shows QR code returned by server + success toast + navigates to detail.

- [ ] **4.2.4 — `EditConsignment.jsx` form**  
  Pre-populated form for `product_type`, `weight`, `destination_pincode`.  
  Separate "Update Image" section using `PUT /consignment/image/{id}`.

### Sprint 4.3 — QR Scan (Consignment Status Update)

**Duration:** 1 day

**Backend calls:**
- `POST /consignment/scan_qr` (multipart/form-data: `qr_image` + `status`)

#### Sub-tasks

- [ ] **4.3.1 — `QRScan.jsx` page**  
  - File upload input for QR image
  - Status selector: `pending` | `in-transit` | `delivered`
  - On submit: POST to `/consignment/scan_qr` with image file + status
  - Display response: consignment ID, new status, updated timestamp
  - Optional: webcam capture button (browser `getUserMedia` API)

---

## Phase 5 — Routes Module

> **Goal:** Visualise optimal delivery paths and route matrix for consignments.

### Sprint 5.1 — Routes Pages

**Duration:** 2 days

**Backend calls:**
- `GET /Paths/optimal_path/{consignment_id}`
- `GET /Paths/matrix?hubs=hub1,hub2&vehicles=3`
- `GET /Paths/routes?source=X&destination=Y`

#### Sub-tasks

- [ ] **5.1.1 — `routes.api.js` service**  
  Create `src/features/routes/service/routes.api.js` with:
  - `getOptimalPath(consignmentId)`
  - `getRouteMatrix({ hubs, vehicles })`
  - `getRoutesBetween({ source, destination })`

- [ ] **5.1.2 — Redux slice for routes**  
  Create `src/features/routes/state/routes.slice.js`.

- [ ] **5.1.3 — `OptimalPathView.jsx` component**  
  Displays the optimal path for a consignment as a horizontal hub-chain visual:
  ```
  [Origin Hub] → [Hub 2] → [Hub 3] → [Destination]
  ```
  With distance (km), estimated time (HH:MM), and cost displayed below.

- [ ] **5.1.4 — `RouteExplorer.jsx` page**  
  - Source/Destination inputs → fetch `GET /Paths/routes`
  - Lists all possible routes with distance, time, cost
  - Highlights recommended route

- [ ] **5.1.5 — `RouteMatrix.jsx` component**  
  Hub selector (multi-select) + vehicle count input → renders a styled distance/time matrix table.

- [ ] **5.1.6 — `Routes.jsx` page assembly**  
  Tab layout: "Optimal Path" | "Route Explorer" | "Matrix".

---

## Phase 6 — Deliveries Module

> **Goal:** Show delivery tasks filtered by the logged-in user's work location.

### Sprint 6.1 — Deliveries Page

**Duration:** 1–2 days

**Backend calls:**
- `GET /Deliveries?work_location={location}`

#### Sub-tasks

- [ ] **6.1.1 — `deliveries.api.js` service**  
  `getDeliveries({ work_location })` using the logged-in user's `work_location` from Redux state by default.

- [ ] **6.1.2 — `useDeliveries` hook**  
  Fetches delivery list on mount, supports manual refresh.

- [ ] **6.1.3 — `DeliveryCard.jsx` component**  
  Card showing: hub/location name, consignment ID, status badge (In Transit / Delayed / Pending), date and time.

- [ ] **6.1.4 — `Deliveries.jsx` page**  
  - Grid of `DeliveryCard` items
  - Optional `work_location` override filter input
  - Empty state illustration for no deliveries
  - Refresh button

---

## Phase 7 — QR Scan Module

> **Already covered as Sprint 4.3.** This phase is for standalone QR Scan navigation entry point from the sidebar.

### Sprint 7.1 — Standalone QR Scan Page

**Duration:** 0.5 days

- [ ] **7.1.1** Wire up the `/qr-scan` route in the router to the `QRScan.jsx` page built in Sprint 4.3.
- [ ] **7.1.2** Add sidebar navigation link for QR Scan with a camera icon.

---

## Phase 8 — Profile & Settings

> **Goal:** Let users view and update their profile information.

### Sprint 8.1 — Profile & Settings Pages

**Duration:** 1–2 days

**Backend calls:**
- `PUT /user/UpdateProfile/` (Bearer, JSON: email, work_location, address, password)

#### Sub-tasks

- [ ] **8.1.1 — `profile.api.js` service**  
  `updateProfile({ email, work_location, address, password })`.

- [ ] **8.1.2 — `Profile.jsx` page**  
  - Display: username, email, role, work_location, address, member since
  - Editable fields: email, work_location, address (inline edit or form)
  - "Change password" section (current + new + confirm)
  - Save button → calls `PUT /user/UpdateProfile/`
  - Avatar with initials (first letter of username)

- [ ] **8.1.3 — `Settings.jsx` page (stub)**  
  Placeholder page with future settings sections:
  - Notification preferences
  - Display preferences (if dark mode is added)

---

## Phase 9 — Polish, Error Handling & Performance

> **Goal:** Production-grade error handling, loading states, empty states, and UX polish across all pages.

### Sprint 9.1 — Error Handling & Loading States

**Duration:** 2 days

#### Sub-tasks

- [ ] **9.1.1 — Global 401 handler**  
  Axios response interceptor: on 401 → clear token → dispatch `setUser(null)` → redirect `/login` with toast "Session expired. Please log in again."

- [ ] **9.1.2 — 422 Validation error display**  
  Parse FastAPI's `{ detail: [{ loc, msg }] }` format and show field-level error messages in forms.

- [ ] **9.1.3 — Error Boundary component**  
  Create `src/shared/components/ErrorBoundary.jsx` (class component) wrapping each page route to catch render errors and show a friendly fallback UI with a "Reload" button.

- [ ] **9.1.4 — Empty state components**  
  Standard `EmptyState.jsx` with icon + title + description + optional CTA button. Used on:
  - Consignments list (no consignments yet)
  - Deliveries (no deliveries)
  - Routes (no path found)

- [ ] **9.1.5 — Skeleton loaders**  
  Replace plain spinners with content-shaped skeleton screens on:
  - Dashboard stat cards
  - Consignment table rows
  - Delivery cards

### Sprint 9.2 — Performance & Final UX

**Duration:** 1–2 days

#### Sub-tasks

- [ ] **9.2.1 — Code splitting**  
  Use `React.lazy` + `Suspense` for each feature page so initial bundle only loads auth code.

- [ ] **9.2.2 — Pagination & infinite scroll**  
  Implement proper pagination (Previous / Next / page numbers) for the consignments list using `limit` + `skip`.

- [ ] **9.2.3 — Search debounce**  
  Add 300ms debounce to the consignment name search to avoid flooding the API.

- [ ] **9.2.4 — Notification badge**  
  Read delayed consignment count from the store and display on the sidebar Consignments link and the top-bar bell icon.

- [ ] **9.2.5 — Favicon & meta tags**  
  Update `index.html` with proper `<title>`, meta description, and a branded favicon.

- [ ] **9.2.6 — Final lint & cleanup**  
  Run `npm run lint`, remove all `console.log` statements, and verify no prop-type warnings in browser console.

---

## File Structure — Target State

```
src/
├── main.jsx
├── app/
│   ├── App.jsx                          # Routes + Provider + Suspense
│   ├── App.css                          # Global design tokens + Tailwind import
│   ├── app.store.js                     # Redux store (all slices)
│   └── layouts/
│       └── AppShell.jsx                 # Sidebar + TopBar + <Outlet>
├── shared/
│   ├── api/
│   │   └── axiosInstance.js             # Central Axios config + interceptors
│   ├── utils/
│   │   └── token.js                     # JWT localStorage helpers
│   └── components/
│       ├── Spinner.jsx
│       ├── Button.jsx
│       ├── StatusBadge.jsx
│       ├── PrivateRoute.jsx
│       ├── PublicRoute.jsx
│       ├── PageHeader.jsx
│       ├── EmptyState.jsx
│       └── ErrorBoundary.jsx
└── features/
    ├── auth/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── service/auth.api.js
    │   ├── state/
    │   │   ├── auth.slice.js
    │   │   └── auth.selectors.js
    │   └── hook/useAuth.js
    ├── dashboard/
    │   ├── pages/Dashboard.jsx
    │   ├── components/
    │   │   ├── StatCard.jsx
    │   │   ├── RecentConsignments.jsx
    │   │   └── UpcomingDeliveries.jsx
    │   └── hook/useDashboardStats.js
    ├── consignments/
    │   ├── pages/
    │   │   ├── ConsignmentList.jsx
    │   │   ├── ConsignmentDetail.jsx
    │   │   ├── CreateConsignment.jsx
    │   │   └── EditConsignment.jsx
    │   ├── components/
    │   │   └── QRScan.jsx
    │   ├── service/consignment.api.js
    │   ├── state/consignment.slice.js
    │   └── hook/useConsignments.js
    ├── routes/
    │   ├── pages/Routes.jsx
    │   ├── components/
    │   │   ├── OptimalPathView.jsx
    │   │   ├── RouteExplorer.jsx
    │   │   └── RouteMatrix.jsx
    │   ├── service/routes.api.js
    │   └── state/routes.slice.js
    ├── deliveries/
    │   ├── pages/Deliveries.jsx
    │   ├── components/DeliveryCard.jsx
    │   ├── service/deliveries.api.js
    │   ├── state/delivery.slice.js
    │   └── hook/useDeliveries.js
    └── profile/
        ├── pages/
        │   ├── Profile.jsx
        │   └── Settings.jsx
        └── service/profile.api.js
```

---

## API Integration Summary

| Feature | Endpoint | Method | Auth |
|---|---|---|---|
| Login | `/user/Login/` | POST (form) | No |
| Signup | `/user/Signup/` | POST (JSON) | No |
| Logout | `/user/logout/` | POST | Bearer |
| Update Profile | `/user/UpdateProfile/` | PUT | Bearer |
| Create Consignment | `/consignment/create` | POST (multipart) | Bearer |
| List Consignments | `/consignment/all` | GET | Bearer |
| Get Consignment | `/consignment/{id}` | GET | Bearer |
| Get by Name | `/consignment/by_name/{name}` | GET | Bearer |
| Update Consignment | `/consignment/update/{id}` | PUT | Bearer |
| Update Image | `/consignment/image/{id}` | PUT (multipart) | Bearer |
| Scan QR | `/consignment/scan_qr` | POST (multipart) | Bearer |
| Check Pincode | `/consignment/check_pincode/{p}` | GET | Bearer |
| Optimal Path | `/Paths/optimal_path/{id}` | GET | Bearer |
| Route Matrix | `/Paths/matrix` | GET | Bearer |
| Routes Between | `/Paths/routes` | GET | Bearer |
| Deliveries | `/Deliveries` | GET | Bearer |

---

## Sprint Sequence & Estimated Timeline

```
Week 1:   Phase 0 (Sprint 0.1) + Phase 1 (Sprint 1.1, 1.2)
Week 2:   Phase 2 (Sprint 2.1) + Phase 3 (Sprint 3.1)
Week 3:   Phase 4 (Sprint 4.1, 4.2, 4.3)
Week 4:   Phase 5 (Sprint 5.1) + Phase 6 (Sprint 6.1) + Phase 7 (Sprint 7.1)
Week 5:   Phase 8 (Sprint 8.1) + Phase 9 (Sprint 9.1, 9.2)
```

**Total estimated duration:** ~5 weeks (solo developer, part-time)

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| JWT stored in `localStorage` | Simpler than cookie-only; backend sends token in response body — must be stored client-side |
| Axios interceptor for auth headers | Centralises token attachment; avoids repeating per-call |
| Feature-Sliced Design folder structure | Scales cleanly as features are added without mixing concerns |
| Tailwind CSS v4 via Vite plugin | Already in project; no config file needed, faster builds |
| Redux Toolkit for all async state | Consistent pattern across all features; already set up for auth |
| `react-hot-toast` for notifications | Lightweight, non-intrusive, easy to call from any hook or service |

---

*End of Development Plan*
