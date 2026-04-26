# SmartSupplyChain — Development Strategy

> This document defines the engineering standards, architectural patterns, and integration contract between the React frontend and the FastAPI backend for the SmartSupplyChain project.

---

## 1. Backend ↔ Frontend Contract

### Base URL & Transport

```
Base URL : https://delivery-routing-system.onrender.com
Protocol : HTTPS
Format   : JSON (except multipart/form-data for file uploads and
           application/x-www-form-urlencoded for login)
```

### Authentication Contract

The backend uses **JWT Bearer Tokens**. The login endpoint returns:

```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

The frontend is responsible for:

| Responsibility | Implementation |
|---|---|
| Storing the token | `localStorage` via `src/shared/utils/token.js` |
| Attaching to every protected request | Axios request interceptor |
| Handling expiry (401 responses) | Axios response interceptor → clear token → redirect `/login` |
| Clearing on logout | `removeToken()` + `dispatch(setUser(null))` |

```
Authorization: Bearer <access_token>
```

Every endpoint marked **(Protected)** in `backend_info.md` requires this header.

### Request Format Rules

| Endpoint group | Content-Type |
|---|---|
| Login | `application/x-www-form-urlencoded` |
| Signup, Profile Update, Consignment Update | `application/json` |
| Create Consignment, Update Image, Scan QR | `multipart/form-data` |

### Response Shape Contract

**Success responses** return the domain object directly or a message wrapper:
```json
{ "access_token": "...", "token_type": "bearer" }
{ "consignment_id": "...", "status": "pending", "qr_code_url": "..." }
{ "message": "Logged out successfully" }
```

**Error responses** always follow this FastAPI shape — the frontend must handle both variants:

```json
// Single error
{ "detail": "Not authenticated" }

// Validation errors (422)
{ "detail": [{ "loc": ["body", "origin_pincode"], "msg": "...", "type": "..." }] }
```

### Pagination Contract

All list endpoints use `limit` + `skip` (offset-based):

```
GET /consignment/all?limit=10&skip=0    // page 1
GET /consignment/all?limit=10&skip=10   // page 2
```

### Field & Value Contracts

| Field | Rule |
|---|---|
| `origin_pincode` / `destination_pincode` | Exactly 6 numeric digits — validated via `GET /consignment/check_pincode/{p}` |
| `status` | Enum: `"pending"` · `"in-transit"` · `"delivered"` |
| `role` | Enum: `"admin"` · `"manager"` · `"operator"` (assigned by backend — **not sent during signup**) |
| Image files | JPEG / PNG / WebP, max 5 MB |
| Timestamps | ISO 8601 strings |
| IDs | UUIDs |

> **Critical:** The Signup endpoint does **not** accept a `role` field. Role is assigned server-side. The current `Register.jsx` `role` select input must be removed.

---

## 2. Architecture Overview

The frontend follows a **Feature-Sliced Design (FSD)** pattern. Each product domain (auth, consignments, routes, deliveries) is fully self-contained. Shared infrastructure lives in `src/shared/`.

### Folder Organisation

```
src/
│
├── main.jsx                        # ReactDOM.createRoot entry point
│
├── app/                            # App-level wiring only
│   ├── App.jsx                     # Provider + BrowserRouter + Routes + Suspense
│   ├── App.css                     # Global CSS variables + @import "tailwindcss"
│   ├── app.store.js                # configureStore — registers all slice reducers
│   └── layouts/
│       └── AppShell.jsx            # Sidebar + TopBar + <Outlet> (authenticated shell)
│
├── shared/                         # Cross-feature reusable code
│   ├── api/
│   │   └── axiosInstance.js        # Base URL, JWT interceptor, error interceptor
│   ├── utils/
│   │   └── token.js                # getToken / setToken / removeToken (localStorage)
│   └── components/
│       ├── Spinner.jsx
│       ├── Button.jsx
│       ├── StatusBadge.jsx         # pending / in-transit / delivered pill
│       ├── PageHeader.jsx          # breadcrumb + title + action slot
│       ├── EmptyState.jsx
│       ├── ErrorBoundary.jsx
│       ├── PrivateRoute.jsx        # Redirects to /login if not authenticated
│       └── PublicRoute.jsx         # Redirects to /dashboard if already authenticated
│
└── features/
    ├── auth/                       # Login, Register, session management
    │   ├── pages/
    │   ├── service/auth.api.js
    │   ├── state/auth.slice.js
    │   ├── state/auth.selectors.js
    │   └── hook/useAuth.js
    │
    ├── dashboard/                  # Overview stats, recent consignments, upcoming deliveries
    │   ├── pages/Dashboard.jsx
    │   ├── components/
    │   └── hook/useDashboardStats.js
    │
    ├── consignments/               # Full CRUD + QR scan
    │   ├── pages/
    │   ├── components/
    │   ├── service/consignment.api.js
    │   ├── state/consignment.slice.js
    │   └── hook/useConsignments.js
    │
    ├── routes/                     # Optimal paths, route explorer, matrix
    │   ├── pages/
    │   ├── components/
    │   ├── service/routes.api.js
    │   └── state/routes.slice.js
    │
    ├── deliveries/                 # Delivery tasks by work_location
    │   ├── pages/
    │   ├── components/
    │   ├── service/deliveries.api.js
    │   ├── state/delivery.slice.js
    │   └── hook/useDeliveries.js
    │
    └── profile/                    # Profile view + update
        ├── pages/
        └── service/profile.api.js
```

**Rules:**
- A feature folder **must not** import from another feature folder directly.
- Features share code only through `src/shared/`.
- Each feature owns its own API service, Redux slice, selectors, hooks, pages, and components.

---

## 3. Data Flow

The app follows a strict **unidirectional data flow**:

```
UI Event (user action)
    │
    ▼
Page Component
    │  calls
    ▼
Custom Hook  (e.g. useAuth, useConsignments)
    │  dispatches setLoading(true)
    │  calls
    ▼
API Service  (e.g. auth.api.js, consignment.api.js)
    │  uses
    ▼
axiosInstance  (attaches Bearer token via interceptor)
    │
    ▼
FastAPI Backend
    │
    ▼
Response
    │
  ┌─┴──────────────┐
Success           Error
  │                 │
dispatch          dispatch
setData(res)      setError(msg)
setLoading(false) setLoading(false)
  │
  ▼
Redux Store
    │  triggers
    ▼
useSelector in component re-renders
    │
    ▼
Updated UI
```

### Example Flow: Login

```
1. User fills username + password in Login.jsx and clicks "Sign in"
2. handleSubmit calls handleLogin({ username, password }) from useAuth
3. useAuth dispatches setLoading(true), setError(null)
4. useAuth calls login() from auth.api.js
5. auth.api.js sends POST /user/Login/ with URLSearchParams (form-encoded)
6. Backend returns { access_token, token_type }
7. useAuth calls setToken(access_token) → stores in localStorage
8. useAuth dispatches setUser(decodedUser) + setLoading(false)
9. Login.jsx reads selectIsAuthenticated → PrivateRoute allows entry
10. navigate('/dashboard')
```

### Example Flow: Create Consignment

```
1. User fills form in CreateConsignment.jsx and uploads an image
2. handleSubmit builds a FormData object with all fields + file
3. Calls createConsignment(formData) from consignment.api.js
4. axiosInstance.post('/consignment/create', formData, multipart headers)
   → interceptor auto-attaches Authorization: Bearer <token>
5. Backend returns { consignment_id, qr_code_url, status: "pending" }
6. dispatch(addConsignment(response))
7. Show QR code in success modal + toast notification
8. navigate('/consignments/{consignment_id}')
```

---

## 4. Centralised Axios Instance

All HTTP calls go through a single configured instance — never a raw `axios.get/post`:

```js
// src/shared/api/axiosInstance.js
import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

Each feature's `*.api.js` file imports and uses this instance:

```js
// src/features/consignments/service/consignment.api.js
import api from '../../../shared/api/axiosInstance';

export async function getAllConsignments({ limit = 10, skip = 0 }) {
  const response = await api.get('/consignment/all', { params: { limit, skip } });
  return response.data;
}
```

---

## 5. State Management

The app uses **Redux Toolkit** for all global async state. No Context API.

### Store Shape

```js
{
  auth: {
    user: null | { id, username, email, role, work_location },
    loading: false,
    error: null,
    initialized: false,        // true after app-load session check completes
  },
  consignments: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  deliveries: {
    items: [],
    loading: false,
    error: null,
  },
  routes: {
    optimalPath: null,
    routeList: [],
    matrix: null,
    loading: false,
    error: null,
  }
}
```

### Slice Pattern

Every slice follows this consistent structure:

```js
// src/features/consignments/state/consignment.slice.js
import { createSlice } from '@reduxjs/toolkit';

const consignmentSlice = createSlice({
  name: 'consignments',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: {
    setConsignments:      (state, action) => { state.items = action.payload.items; state.total = action.payload.total; },
    appendConsignments:   (state, action) => { state.items.push(...action.payload); },
    setConsignmentLoading:(state, action) => { state.loading = action.payload; },
    setConsignmentError:  (state, action) => { state.error = action.payload; },
  }
});

export const { setConsignments, appendConsignments, setConsignmentLoading, setConsignmentError } = consignmentSlice.actions;
export default consignmentSlice.reducer;
```

### Selectors Pattern

Each slice has a companion selectors file for clean component access:

```js
// src/features/auth/state/auth.selectors.js
export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectAuthLoading     = (state) => state.auth.loading;
export const selectAuthError       = (state) => state.auth.error;
export const selectInitialized     = (state) => state.auth.initialized;
```

### Custom Hook Pattern

Each feature exposes a single hook that orchestrates dispatch + API calls. Components call only the hook — never the API service or dispatch directly.

```js
// src/features/consignments/hook/useConsignments.js
import { useDispatch, useSelector } from 'react-redux';
import { setConsignments, setConsignmentLoading, setConsignmentError } from '../state/consignment.slice';
import { getAllConsignments } from '../service/consignment.api';

export function useConsignments() {
  const dispatch = useDispatch();
  const items    = useSelector((s) => s.consignments.items);
  const loading  = useSelector((s) => s.consignments.loading);
  const error    = useSelector((s) => s.consignments.error);

  const fetchAll = async ({ limit = 10, skip = 0 } = {}) => {
    dispatch(setConsignmentLoading(true));
    dispatch(setConsignmentError(null));
    try {
      const data = await getAllConsignments({ limit, skip });
      dispatch(setConsignments({ items: data, total: data.length }));
    } catch (err) {
      dispatch(setConsignmentError(err.response?.data?.detail ?? err.message));
    } finally {
      dispatch(setConsignmentLoading(false));
    }
  };

  return { items, loading, error, fetchAll };
}
```

### Using in a Component

```jsx
// src/features/consignments/pages/ConsignmentList.jsx
import { useEffect } from 'react';
import { useConsignments } from '../hook/useConsignments';
import Spinner from '../../../shared/components/Spinner';

export default function ConsignmentList() {
  const { items, loading, error, fetchAll } = useConsignments();

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-500">{error}</p>;

  return (
    <ul>
      {items.map((c) => <li key={c.consignment_id}>{c.product_type}</li>)}
    </ul>
  );
}
```

---

## 6. Key Patterns

### 6.1 — Multipart File Upload (Consignment Image)

The backend expects `multipart/form-data` for consignment creation and image updates. Axios handles this automatically when a `FormData` object is passed — **do not manually set `Content-Type`**.

```js
// consignment.api.js
export async function createConsignment({ origin_pincode, destination_pincode, product_type, weight, imageFile }) {
  const formData = new FormData();
  formData.append('origin_pincode',      origin_pincode);
  formData.append('destination_pincode', destination_pincode);
  formData.append('product_type',        product_type);
  formData.append('weight',              weight);
  formData.append('image',               imageFile);          // File object from <input type="file">

  const response = await api.post('/consignment/create', formData);
  // Axios auto-sets: Content-Type: multipart/form-data; boundary=...
  return response.data;
}
```

In the component, read the file from the input event:

```jsx
const [imageFile, setImageFile] = useState(null);

<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={(e) => setImageFile(e.target.files[0])}
/>
```

Validate client-side before sending:
- File size ≤ 5 MB: `file.size <= 5 * 1024 * 1024`
- Type: `['image/jpeg','image/png','image/webp'].includes(file.type)`

### 6.2 — Pincode Live Validation

```js
// On input blur — call backend validation
const validatePincode = async (pincode) => {
  if (!/^\d{6}$/.test(pincode)) {
    setPincodeError('Must be exactly 6 digits');
    return;
  }
  const result = await api.get(`/consignment/check_pincode/${pincode}`);
  if (result.data.valid) {
    setPincodeStatus(`✓ ${result.data.region}`);
  } else {
    setPincodeError('Invalid pincode');
  }
};
```

### 6.3 — Protected & Public Routes

```jsx
// src/shared/components/PrivateRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated, selectInitialized } from '../../features/auth/state/auth.selectors';
import Spinner from './Spinner';

export default function PrivateRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized     = useSelector(selectInitialized);

  if (!initialized) return <Spinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

```jsx
// src/shared/components/PublicRoute.jsx
export default function PublicRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

Route tree in `App.jsx`:

```jsx
<Routes>
  {/* Public */}
  <Route element={<PublicRoute />}>
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />
  </Route>

  {/* Protected — inside persistent AppShell layout */}
  <Route element={<PrivateRoute />}>
    <Route element={<AppShell />}>
      <Route path="/dashboard"           element={<Dashboard />} />
      <Route path="/consignments"        element={<ConsignmentList />} />
      <Route path="/consignments/new"    element={<CreateConsignment />} />
      <Route path="/consignments/:id"    element={<ConsignmentDetail />} />
      <Route path="/routes"             element={<Routes />} />
      <Route path="/deliveries"         element={<Deliveries />} />
      <Route path="/qr-scan"            element={<QRScan />} />
      <Route path="/profile"            element={<Profile />} />
      <Route path="/settings"           element={<Settings />} />
    </Route>
  </Route>
</Routes>
```

### 6.4 — Centralised Error Handling

**422 Validation errors** from FastAPI return an array. Parse them into field-level messages:

```js
// src/shared/utils/parseApiError.js
export function parseApiError(error) {
  const detail = error.response?.data?.detail;

  // Array → validation errors
  if (Array.isArray(detail)) {
    return detail.reduce((acc, err) => {
      const field = err.loc[err.loc.length - 1];  // last element is field name
      acc[field] = err.msg;
      return acc;
    }, {});
  }

  // String → generic message
  if (typeof detail === 'string') return { _general: detail };

  return { _general: 'Something went wrong. Please try again.' };
}
```

Usage in a hook:

```js
} catch (err) {
  const errors = parseApiError(err);
  dispatch(setError(errors._general ?? 'Error'));
  setFieldErrors(errors);   // local state for inline form errors
}
```

### 6.5 — Session Persistence on App Load

Run once in `App.jsx` before rendering any route:

```js
useEffect(() => {
  const token = getToken();
  if (!token) {
    dispatch(setInitialized(true));
    return;
  }
  // Decode JWT payload (base64) to get user info without a /me endpoint
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check token expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeToken();
      dispatch(setInitialized(true));
      return;
    }
    dispatch(setUser({ username: payload.sub, ...payload }));
  } catch {
    removeToken();
  } finally {
    dispatch(setInitialized(true));
  }
}, []);
```

### 6.6 — Tailwind CSS v4 Component Styling

Tailwind v4 is loaded via the Vite plugin — no `tailwind.config.js` needed. CSS custom properties defined in `App.css` serve as the design token system:

```css
/* src/app/App.css */
@import "tailwindcss";

:root {
  --color-primary:     #2563EB;   /* blue-600  — buttons, links, active nav */
  --color-surface:     #FFFFFF;   /* card backgrounds */
  --color-background:  #F0F4FF;   /* page background (light blue-grey) */
  --color-sidebar:     #1E293B;   /* sidebar dark slate */
  --color-text:        #1E293B;
  --color-muted:       #64748B;
  --color-danger:      #EF4444;
  --color-warning:     #F59E0B;
  --color-success:     #22C55E;
  --radius-card:       0.75rem;
  --shadow-card:       0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
}
```

**StatusBadge pattern** — drives pill colour from status string:

```jsx
// src/shared/components/StatusBadge.jsx
const config = {
  'pending':    'bg-gray-100  text-gray-600',
  'in-transit': 'bg-blue-100  text-blue-700',
  'delivered':  'bg-green-100 text-green-700',
  'delayed':    'bg-amber-100 text-amber-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config[status] ?? config.pending}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {status}
    </span>
  );
}
```

---

## 7. Environment Configuration

```bash
# .env  (never commit — add to .gitignore)
VITE_API_BASE_URL=https://delivery-routing-system.onrender.com
```

All `import.meta.env.VITE_*` variables are inlined at build time by Vite.

---

## 8. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React components | PascalCase `.jsx` | `ConsignmentList.jsx` |
| Custom hooks | camelCase, `use` prefix | `useConsignments.js` |
| API service files | `<feature>.api.js` | `consignment.api.js` |
| Redux slices | `<feature>.slice.js` | `consignment.slice.js` |
| Selectors files | `<feature>.selectors.js` | `auth.selectors.js` |
| CSS variables | `--color-*`, `--radius-*` | `--color-primary` |
| Env variables | `VITE_` prefix | `VITE_API_BASE_URL` |
| Route paths | kebab-case | `/qr-scan`, `/consignments/:id` |

---

## 9. Development Checklist (Per Feature)

When implementing any new feature, work through this checklist in order:

- [ ] Add API functions to `<feature>.api.js` (uses `axiosInstance`)
- [ ] Create or update `<feature>.slice.js` with state, reducers, actions
- [ ] Add selectors to `<feature>.selectors.js`
- [ ] Register reducer in `app.store.js`
- [ ] Write `use<Feature>.js` custom hook (dispatch + API + error handling)
- [ ] Build page component(s) — uses only the hook, never direct API/dispatch
- [ ] Add route in `App.jsx`
- [ ] Add sidebar nav link in `Sidebar.jsx`
- [ ] Handle loading state (Spinner or skeleton)
- [ ] Handle error state (inline message or toast)
- [ ] Handle empty state (`EmptyState.jsx`)

---

*End of Development Strategy*
