# SmartSupplyChain — Development Log

> This document is a living record of all development work done sprint by sprint.  
> Each entry should be added **when the sprint is completed**, not before.  
> Format: Sprint → Changes Made → Files Modified → Test Results → Issues Encountered

---

## Log Format (Template)

```
### Sprint X.Y — [Sprint Name]
**Date:** YYYY-MM-DD  
**Time:** HH:MM IST  
**By:** Divyanshu  
**Status:** ✅ Complete | 🔄 In Progress | ⏸ Blocked

#### Changes Made
- Description of what was done

#### Files Modified
- `path/to/file.jsx` — what changed

#### Test Results
- [ ] Verified behaviour X
- [ ] Verified behaviour Y

#### Issues / Notes
- Any blockers, decisions, or deviations from the plan
```

---

## Phase 0 — Foundation & Architecture Fixes

---

### Sprint 0.1 — Project Cleanup & Infrastructure Setup

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 1 — Authentication & Session Management

---

### Sprint 1.1 — Auth Fixes & JWT Integration

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

### Sprint 1.2 — Protected Routes & Role Guards

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 2 — Core Layout & Navigation Shell

---

### Sprint 2.1 — AppShell Layout Component

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 3 — Dashboard

---

### Sprint 3.1 — Dashboard Page

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 4 — Consignments Module

---

### Sprint 4.1 — Consignments List & Detail

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

### Sprint 4.2 — Create & Edit Consignment

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

### Sprint 4.3 — QR Scan (Consignment Status Update)

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 5 — Routes Module

---

### Sprint 5.1 — Routes Pages

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 6 — Deliveries Module

---

### Sprint 6.1 — Deliveries Page

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 7 — QR Scan Module

---

### Sprint 7.1 — Standalone QR Scan Page

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 8 — Profile & Settings

---

### Sprint 8.1 — Profile & Settings Pages

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Phase 9 — Polish, Error Handling & Performance

---

### Sprint 9.1 — Error Handling & Loading States

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

### Sprint 9.2 — Performance & Final UX

**Date:** —  
**Time:** —  
**By:** Divyanshu  
**Status:** ⏸ Not Started

#### Changes Made
*(Log here when completed)*

#### Files Modified
*(Log here when completed)*

#### Test Results
*(Log here when completed)*

#### Issues / Notes
*(Log here when completed)*

---

## Pre-Dev Audit Fixes (Sprint 0.1 / 1.1)

Track all 14 audit items here once resolved:

| Issue ID | Description | Resolved In | Date |
|---|---|---|---|
| ISSUE-01 | `response.user` → fix login/register response parsing | Sprint 1.1 | — |
| ISSUE-02 | `withCredentials` → switch to JWT Bearer via interceptor | Sprint 0.1 | — |
| ISSUE-03 | No token storage → create `token.js` + `axiosInstance.js` | Sprint 0.1 | — |
| ISSUE-04 | Logout URL `/user/Logout` → `/user/logout/` | Sprint 1.1 | — |
| ISSUE-05 | Logout hardcoded response → return `response.data` | Sprint 1.1 | — |
| ISSUE-06 | Signup sends `role` → remove from schema | Sprint 1.1 | — |
| ISSUE-07 | Login URL missing trailing slash → `/user/Login/` | Sprint 1.1 | — |
| ISSUE-08 | Signup URL missing trailing slash → `/user/Signup/` | Sprint 1.1 | — |
| ISSUE-09 | `error.message` → extract FastAPI `detail` | Sprint 1.1 | — |
| ISSUE-10 | Delete `app.routes.jsx` (dead file) | Sprint 0.1 | — |
| ISSUE-11 | `setInitialized` never dispatched → wire in `App.jsx` | Sprint 1.1 | — |
| ISSUE-12 | Logout button on Login page → remove | Sprint 1.1 | — |
| ISSUE-13 | Docs say "cookie-based" → update to JWT | Sprint 0.1 | — |
| ISSUE-14 | `GET /user/me` doesn't exist → use JWT decode | Sprint 1.1 | — |

---

*End of Development Log*
