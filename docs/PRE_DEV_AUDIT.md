# Pre-Development Audit — Inconsistencies & Resolution Plan

> Cross-reference of: live codebase ↔ `backend_info.md` ↔ `DEVELOPMENT_PLAN.md` ↔ `DEVELOPMENT_STRATEGY.md`  
> All issues must be resolved **before** Phase 1 development begins.

---

## Summary

| Category | Count |
|---|---|
| 🔴 Critical — breaks runtime behaviour | 5 |
| 🟠 Contract mismatch — wrong data sent/expected | 4 |
| 🟡 Dead / conflicting code | 3 |
| 🔵 Doc inconsistency — docs contradict each other | 2 |
| **Total** | **14** |

---

## 🔴 Critical Issues (Fix First)

---

### ISSUE-01 — `response.user` does not exist — login & register both broken

**Files:** `src/features/auth/hook/useAuth.js` lines 12 & 25  
**Severity:** 🔴 Runtime bug — `auth.user` will always be set to `undefined`

**The problem:**

```js
// useAuth.js — handleLogin
const response = await login({ username, password });
dispatch(setUser(response.user));   // ❌ response has NO .user property
```

```js
// useAuth.js — handleRegister
const response = await register({ ... });
dispatch(setUser(response.user));   // ❌ same problem
```

**What the backend actually returns:**

| Endpoint | Actual response shape |
|---|---|
| `POST /user/Login/` | `{ access_token: string, token_type: "bearer" }` |
| `POST /user/Signup/` | `{ id, username, email, role }` |

Neither response has a `.user` key. `response.user` is always `undefined`, so Redux `auth.user` is always `null` even after a successful login. The app behaves as permanently unauthenticated.

**Resolution:**

```js
// handleLogin — store token, build user object from response
const response = await login({ username, password });
setToken(response.access_token);               // persist JWT
dispatch(setUser({
  username: formData.username,                 // from JWT decode or cached input
  token: response.access_token
}));

// handleRegister — backend returns the user object directly
const response = await register({ ... });
dispatch(setUser(response));                   // { id, username, email, role }
```

---

### ISSUE-02 — Auth mechanism mismatch: `withCredentials` vs JWT Bearer

**File:** `src/features/auth/service/auth.api.js` line 6  
**Severity:** 🔴 Every protected API call will fail with 401

**The problem:**

```js
const authApiInstance = axios.create({
    baseURL: "...",
    withCredentials: true,   // ❌ sends browser cookies — backend uses JWT, not cookies
})
```

`backend_info.md` is explicit:
> **Authentication**: OAuth2 Bearer Token (JWT)  
> Add header `Authorization: Bearer {access_token}` to all protected requests

`withCredentials: true` sends session cookies — which the backend does not use. Protected endpoints will return 401 on every call.

**Resolution:**  
Remove `withCredentials: true`. Replace the standalone Axios instance with the shared `axiosInstance.js` that attaches `Authorization: Bearer <token>` via a request interceptor.

---

### ISSUE-03 — No token storage or retrieval mechanism exists anywhere

**Severity:** 🔴 JWT received at login is immediately discarded — session cannot persist

**The problem:**  
After login the backend sends `{ access_token }`. The current code:
1. Ignores `access_token` entirely (see ISSUE-01)
2. Has no `token.js` utility
3. Has no Axios interceptor to attach the token

So even if ISSUE-01 is fixed, the token is never stored and never sent on subsequent requests.

**Resolution:**  
Create `src/shared/utils/token.js`:
```js
export const getToken    = () => localStorage.getItem('sc_token');
export const setToken    = (t) => localStorage.setItem('sc_token', t);
export const removeToken = () => localStorage.removeItem('sc_token');
```
And create `src/shared/api/axiosInstance.js` with a request interceptor that calls `getToken()` and attaches `Authorization: Bearer <token>`.

---

### ISSUE-04 — Logout endpoint URL is wrong (case mismatch)

**File:** `src/features/auth/service/auth.api.js` line 42  
**Severity:** 🔴 Logout will always 404

**The problem:**

```js
// auth.api.js
await authApiInstance.post("/user/Logout", ...);   // ❌ capital L
```

**`backend_info.md` specifies:**
```
POST /user/logout/    (lowercase 'l', trailing slash)
```

FastAPI routes are case-sensitive. `/user/Logout` ≠ `/user/logout/`.

**Resolution:** Change to `/user/logout/`.

---

### ISSUE-05 — Logout ignores actual backend response; always returns hardcoded success

**File:** `src/features/auth/service/auth.api.js` lines 41–49  
**Severity:** 🔴 A failed logout (network error, 401) silently appears successful to the UI

**The problem:**

```js
export async function logout() {
    await authApiInstance.post("/user/Logout", {}, { withCredentials: true });
    return {                          // ❌ always returned even if the POST threw
        message: "Logged out successfully",
        success: true,
        user: null
    }
}
```

If the `await` throws (e.g., token expired, 401), execution jumps to the caller's `catch` — but if it somehow succeeds silently, the hardcoded object masks the real server message.

**Resolution:**

```js
export async function logout() {
    const response = await api.post('/user/logout/');   // uses shared instance with Bearer
    return response.data;                               // returns actual { message }
}
```

---

## 🟠 Contract Mismatches

---

### ISSUE-06 — Signup sends `role` field; backend does not accept it

**Files:** `src/features/auth/pages/Register.jsx`, `src/features/auth/hook/useAuth.js`, `src/features/auth/service/auth.api.js`  
**Severity:** 🟠 May cause 422 Validation Error on registration

**The problem:**  
`Register.jsx` has a `role` select input. It is passed through `useAuth.handleRegister` → `auth.api.register` → sent in the JSON body.

**`backend_info.md` Signup body schema:**
```json
{ "username", "email", "password", "work_location", "address" }
```
No `role` field. Role is assigned server-side. Sending an unknown field may cause FastAPI to return a 422.

**Resolution:**
- Remove `role` from `Register.jsx` state, form, and `handleSubmit`
- Remove `role` parameter from `useAuth.handleRegister` signature
- Remove `role` from the `auth.api.register` function body

---

### ISSUE-07 — Login URL missing trailing slash

**File:** `src/features/auth/service/auth.api.js` line 30  
**Severity:** 🟠 May 307-redirect or 404 depending on server config

**The problem:**

```js
authApiInstance.post('/user/Login', params, ...)   // ❌ no trailing slash
```

**`backend_info.md`:** `POST /user/Login/` — trailing slash is part of the FastAPI route.

**Resolution:** Change to `/user/Login/`.

---

### ISSUE-08 — Signup URL missing trailing slash

**File:** `src/features/auth/service/auth.api.js` line 11  
**Severity:** 🟠 Same as ISSUE-07

```js
authApiInstance.post('/user/Signup', { ... })   // ❌ no trailing slash
```

**`backend_info.md`:** `POST /user/Signup/`

**Resolution:** Change to `/user/Signup/`.

---

### ISSUE-09 — `setError` receives `error.message` (Axios wrapper), not the backend detail

**File:** `src/features/auth/hook/useAuth.js` lines 17, 30, 44  
**Severity:** 🟠 Error messages shown to the user (once wired to UI) will be generic JS strings, not FastAPI's `detail` messages

**The problem:**

```js
dispatch(setError(error.message));
// error.message = "Request failed with status code 422"
// Actual useful info is in error.response.data.detail
```

**Resolution:**

```js
const detail = error.response?.data?.detail;
const msg = Array.isArray(detail)
  ? detail.map(e => e.msg).join(', ')   // 422 validation array
  : (detail ?? error.message);           // string or fallback
dispatch(setError(msg));
```

---

## 🟡 Dead / Conflicting Code

---

### ISSUE-10 — `app.routes.jsx` is dead code that conflicts with `App.jsx` routing

**File:** `src/app/app.routes.jsx`  
**Severity:** 🟡 Confusion / maintenance hazard

**The problem:**  
`app.routes.jsx` defines a `createBrowserRouter` with `/` → `<Login />`. It is imported nowhere and never used. Meanwhile `App.jsx` inline-defines routes with `/` → `<h1>Home</h1>`. Two conflicting route definitions exist; one is simply never used.

**Resolution:** Delete `src/app/app.routes.jsx`.

---

### ISSUE-11 — `setInitialized` is exported but never dispatched

**File:** `src/features/auth/state/auth.slice.js` line 27  
**Severity:** 🟡 `auth.initialized` stays `false` forever — PrivateRoute logic cannot work

**The problem:**  
`initialized` was added to the slice to signal that the app-load session check is complete. The PrivateRoute pattern (in `DEVELOPMENT_STRATEGY.md`) depends on it:

```js
if (!initialized) return <Spinner fullScreen />;
```

But `setInitialized` is never called anywhere in the codebase. If PrivateRoute is built before this is wired up, every page will show a spinner forever.

**Resolution:**  
In `App.jsx`'s startup `useEffect`, dispatch `setInitialized(true)` after the token check (whether a valid session is found or not).

---

### ISSUE-12 — Logout button rendered inside the Login page

**File:** `src/features/auth/pages/Login.jsx` lines 95–101  
**Severity:** 🟡 Wrong UX — unauthenticated page has a logout action

**The problem:**

```jsx
<button type="button" onClick={handleLogout}>
  Logout
</button>
```

This button lives on the public Login page. An unauthenticated user cannot and should not be able to log out. It calls `handleLogout` which will fire `POST /user/logout/` with no valid token.

**Resolution:** Remove from `Login.jsx`. Logout belongs in the authenticated `AppShell` (sidebar user menu or top-bar avatar dropdown).

---

## 🔵 Documentation Inconsistencies

---

### ISSUE-13 — `CODEBASE_REPORT.md` describes "Cookie-based sessions" — contradicts backend contract

**File:** `docs/CODEBASE_REPORT.md` — Backend Integration section  
**Severity:** 🔵 Misleading documentation

**The problem:**

> Auth mechanism: Cookie-based sessions (`withCredentials: true`)

`backend_info.md` clearly states JWT Bearer Token authentication. This was accurate to the existing broken code, but is wrong relative to the actual backend and will mislead anyone reading the report.

**Resolution:** Update the Backend Integration section of `CODEBASE_REPORT.md` to say **JWT Bearer Token** stored in `localStorage`, attached via Axios request interceptor.

---

### ISSUE-14 — `DEVELOPMENT_PLAN.md` Sprint 1.1.3 references `GET /user/me` — endpoint does not exist

**File:** `docs/DEVELOPMENT_PLAN.md` — Sprint 1.1.3  
**Severity:** 🔵 Planning based on a non-existent endpoint

**The problem:**

> After token is stored, call `GET /user/me` (or equivalent profile endpoint) to populate the user object

`backend_info.md` lists no `/user/me` or `/user/profile` GET endpoint. The available user endpoints are only: `POST /user/Login/`, `POST /user/Signup/`, `POST /user/logout/`, `PUT /user/UpdateProfile/`.

**Resolution:**  
Update Sprint 1.1.3 in `DEVELOPMENT_PLAN.md`. Instead of fetching a profile endpoint, decode the JWT payload client-side using `atob(token.split('.')[1])` to extract `username` and any other claims. If no claims are embedded, cache the username from the login form input.

---

## Resolution Plan — Ordered Execution

All 14 issues should be fixed in a single cleanup commit before any feature development starts.

### Step 1 — Delete dead file
```
DELETE: src/app/app.routes.jsx
```

### Step 2 — Create shared infrastructure (new files)
```
CREATE: src/shared/utils/token.js          (getToken, setToken, removeToken)
CREATE: src/shared/api/axiosInstance.js    (base URL from .env, Bearer interceptor, 401 handler)
CREATE: .env                               (VITE_API_BASE_URL=...)
UPDATE: .gitignore                         (add .env)
```

### Step 3 — Fix `auth.api.js` (rewrite entire file)
| Line(s) | Fix |
|---|---|
| 4–7 | Remove standalone `authApiInstance`; import shared `api` from `axiosInstance.js` |
| 6 | Remove `withCredentials: true` |
| 11 | Fix URL: `/user/Signup` → `/user/Signup/` |
| 15 | Remove `role` from request body |
| 30 | Fix URL: `/user/Login` → `/user/Login/` |
| 42 | Fix URL: `/user/Logout` → `/user/logout/` |
| 43 | Remove redundant `withCredentials: true` override |
| 45–49 | Return actual `response.data` instead of hardcoded object |

### Step 4 — Fix `useAuth.js`
| Location | Fix |
|---|---|
| `handleRegister` params | Remove `role` from destructuring and call |
| `handleLogin` line 25 | `dispatch(setUser({...}))` using `access_token` decode, not `response.user` |
| `handleLogin` | Call `setToken(response.access_token)` |
| `handleRegister` line 12 | `dispatch(setUser(response))` — backend returns user object directly |
| All catch blocks | Extract `error.response?.data?.detail` for meaningful error messages |
| All handlers | Dispatch `setError(null)` at the start of each call |

### Step 5 — Fix `Register.jsx`
| Location | Fix |
|---|---|
| State | Remove `role: ''` from initial state |
| JSX | Remove `role` select input entirely |
| `handleSubmit` | Remove `role` from the object passed to `handleRegister` |
| After success | Add `navigate('/login')` + success toast |

### Step 6 — Fix `Login.jsx`
| Location | Fix |
|---|---|
| Line 95–101 | Remove the Logout button entirely |
| `handleSubmit` | Wrap in try/catch; show error if login fails |

### Step 7 — Wire `setInitialized` in `App.jsx`
Add startup `useEffect` that:
1. Reads `getToken()` from localStorage
2. If valid (and not expired) → decode payload → `dispatch(setUser(...))` 
3. Always → `dispatch(setInitialized(true))`

### Step 8 — Update docs
| File | Update |
|---|---|
| `docs/CODEBASE_REPORT.md` | Change "Cookie-based sessions" → "JWT Bearer Token" in Backend Integration section |
| `docs/DEVELOPMENT_PLAN.md` | Update Sprint 1.1.3 to remove `GET /user/me` reference; replace with JWT decode approach |

---

## Post-Fix Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `npm run lint` returns zero errors
- [ ] Register form submits without `role` field; no 422 from backend
- [ ] Login returns `access_token`; token is visible in `localStorage` under key `sc_token`
- [ ] Refreshing the page after login keeps the user authenticated (session persists)
- [ ] Navigating to `/login` when already authenticated redirects to `/dashboard`
- [ ] Navigating to `/dashboard` when not authenticated redirects to `/login`
- [ ] Logout clears `localStorage`, clears Redux `auth.user`, navigates to `/login`
- [ ] All three auth endpoint URLs have trailing slashes matching `backend_info.md`
- [ ] No `withCredentials` anywhere in auth code
- [ ] `app.routes.jsx` file no longer exists

---

*End of Pre-Development Audit*
