# Attendance API – Handover Guide

Comprehensive overview of the attendance management backend so a new contributor can reason about the system, extend it safely, and debug issues quickly.

---

## 1. System Overview
- **Stack**: Next.js App Router (Route Handlers) running as a backend-only API, MongoDB via Mongoose, JSON Web Tokens for auth and HTTP-only cookies for session persistence.
- **Domain**: Multi-role (admin, manager, employee) attendance tracking with leave management.
- **Entry Point**: All server logic lives inside `src/app/api/**` routes. There is no separate Express server—the Next.js runtime hosts each handler.
- **Responses**: Unified helpers in `src/lib/http.ts` and error capturing in `src/lib/api-response.ts` keep payloads consistent: `{ success, data?, message? }`.

### Typical Request Flow
1. **Route handler** receives the request (`src/app/api/...`).
2. **Session resolution** via `getSessionUser` (`src/lib/current-user.ts`):
   - Pulls Bearer token from `Authorization` header or `attendance_token` cookie.
   - Verifies JWT (`src/lib/auth.ts`) and loads the user from MongoDB.
3. **Authorization guard** using `assertRole`/`assertAuthenticated`.
4. **Payload validation** with Zod schemas in `src/lib/validators.ts`.
5. **DB operations** after `connectDB()` ensures a singleton Mongoose connection (`src/lib/db.ts`).
6. **Consistent responses** using `jsonResponse` / `errorResponse`; errors flow through `handleApiError` which logs via `src/lib/api-logger.ts`.

---

## 2. Environment & Running Locally

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Connection string (required). |
| `AUTH_SECRET` | JWT signing secret (required). |
| `AUTH_TOKEN_EXPIRES_IN` | Token TTL hint for integrations (default 7d). |
| `SMTP_*`, `EMAIL_FROM` | Reserved for future email notifications. |

Setup:
```bash
npm install
npm run dev   # serves Next.js API on http://localhost:3000
```

---

## 3. Authentication & Roles
- **Registration**: `POST /api/auth/register` seeds the very first user as `admin`; everyone else defaults to `employee` unless an admin/manager overrides the role.
- **Login**: `POST /api/auth/login` validates credentials, updates `lastLoginAt`, returns token payload and sets the secure `attendance_token` cookie (`setAuthCookie`).
- **Session retrieval**: `getSessionUser(requireAuth)` handles both cookie and header tokens. When `requireAuth=false`, callers can allow anonymous access.
- **Logout**: `POST /api/auth/logout` deletes the cookie (`clearAuthCookie`).
- **Roles**:
  - `admin`: full access to users, attendance, leave.
  - `manager`: may manage their direct reports (users referencing them via `manager` field) plus themselves.
  - `employee`: self-service only.

---

## 4. Domain Models (Mongoose)

| Model | Fields (highlights) | Notes |
| --- | --- | --- |
| `User` (`src/models/User.ts`) | `name`, `email`, `passwordHash`, `role`, `department`, `designation`, `status`, `manager`, `lastLoginAt` | `toJSON` removes password hash; managers reference other users. |
| `Attendance` (`src/models/Attendance.ts`) | `user`, `date`, `checkInAt`, `checkOutAt`, `status`, `workDurationMinutes`, `lateByMinutes`, `notes`, `location`, `deviceInfo` | Unique per user/date; `pre("save")` computes `workDurationMinutes`. |
| `LeaveRequest` (`src/models/LeaveRequest.ts`) | `user`, `manager`, `startDate`, `endDate`, `type`, `status`, `reason`, `reply` | Index on `user/startDate`; managers/admins approve or reject. |

---

## 5. Key Library Helpers
- `src/lib/auth.ts`: hashing (`bcrypt`), JWT sign/verify, cookie management.
- `src/lib/current-user.ts`: resolves the logged-in user document once per request.
- `src/lib/permissions.ts`: narrow asserts to guard routes (`assertRole`, `assertAuthenticated`).
- `src/lib/validators.ts`: all Zod schemas for requests (register/login, attendance ops, leave decisions, etc.).
- `src/lib/http.ts`: helpers to keep JSON structures aligned.
- `src/lib/api-response.ts`: maps thrown errors (`Unauthorized`, `Forbidden`, generic) to HTTP responses and logs them.

---

## 6. API Surface Summary

### Auth Routes
| Method & Path | Purpose | Notes |
| --- | --- | --- |
| `POST /api/auth/register` | Create a user & auto-login. | First user forced to `admin`. |
| `POST /api/auth/login` | Issue JWT + set cookie. | Updates `lastLoginAt`. |
| `POST /api/auth/logout` | Invalidate cookie. | Stateless—client should drop token header too. |
| `GET /api/auth/me` | Return current user profile. | Requires valid token. |

### User Management
| Method & Path | Actors | Behaviour |
| --- | --- | --- |
| `GET /api/users` | admin, manager | Admin sees all users; manager limited to direct reports. |
| `POST /api/users` | admin, manager | Validates via `registerUserSchema`; managers cannot create admins. |
| `GET /api/users/:id` | admin, manager, self | Managers can only view themselves or their team members. |
| `PATCH /api/users/:id` | admin, manager, self | `updateUserSchema`; employees may only edit their own basic info. |
| `DELETE /api/users/:id` | admin | Hard delete user record. |

### Attendance
| Method & Path | Actors | Behaviour |
| --- | --- | --- |
| `POST /api/attendance/check-in` | any logged-in user | One record per day; optional geo/device metadata. |
| `POST /api/attendance/check-out` | any logged-in user | Rejects if already checked out or no check-in. |
| `GET /api/attendance` | role-aware | Query by status/date range; employees only see self, managers see self + direct reports unless admin. |
| `POST /api/attendance` | admin, manager | Manual entry/upsert for any user (managers limited to their team). |
| `GET /api/attendance/:id` | role-aware | `ensurePermission` enforces user visibility. |
| `PATCH /api/attendance/:id` | admin, manager, self | Users can adjust their own entries; managers/admins can edit subordinates. |
| `DELETE /api/attendance/:id` | admin, manager | Managers may delete only if record belongs to them or their team. |
| `GET /api/attendance/summary` | role-aware | Aggregates per user (present/absent/half/on-leave counts + total minutes). |

### Leave Management
| Method & Path | Actors | Behaviour |
| --- | --- | --- |
| `GET /api/leave` | role-aware | Filters by role (employee=self, manager=self+team, admin all). |
| `POST /api/leave` | any logged-in user | Creates leave request; auto-links current manager if set. |
| `GET /api/leave/:id` | role-aware | Same visibility rules as list. |
| `PATCH /api/leave/:id` | admin, manager | Approve/reject via `leaveDecisionSchema`; managers restricted to their team’s requests. |
| `DELETE /api/leave/:id` | admin, manager | Hard delete (typically after resolution). |

---

## 7. Critical Flows

### Attendance Check-In / Out
1. Authenticated employee hits `/api/attendance/check-in`.
2. Handler ensures no record exists for the day (`getDayRange`), then creates one with check-in timestamp and optional metadata.
3. `/check-out` locates the same record, appends `checkOutAt`, and triggers `pre("save")` to compute `workDurationMinutes`.

### Manual Attendance Adjustment
1. Admin/manager sends payload to `POST /api/attendance`.
2. Validates user ID + timestamp combo; managers can only target direct reports.
3. Route upserts the record for the day, useful for missed punches or corrections.

### Leave Request Lifecycle
1. Employee submits via `POST /api/leave`.
2. Admin/manager reviews detail on `/api/leave/:id`.
3. Decision recorded through `PATCH /api/leave/:id` with `status` + optional `reply`; manager field updated to the reviewer.
4. Optional deletion for clean-up.

---

## 8. Extending & Debugging Tips
- **Add a new route**: create `src/app/api/<feature>/route.ts` (or nested `[id]` folder), reuse helpers: `getSessionUser`, `assertRole`, Zod validation, `connectDB`, `jsonResponse`.
- **New model fields**: update Mongoose schema, adjust `toJSON` transforms, update validators + any affected controllers.
- **Permissions**: Follow the existing pattern—prefer central helpers or small functions (`ensurePermission`, `canManageUser`) to keep logic auditable.
- **Error tracing**: `logApiError` already dumps stack traces; check Next.js server console/logs.
- **Testing**: Use REST clients (Thunder Client, Postman) with cookie support or copy the JWT from `/auth/login`. Suggested order: register admin → create team → employee login → check-in/out → summary → leave request.

---

## 9. Operational Checklist for Handover
- [ ] Populate `.env.local` from `env.local.example` with real secrets/URIs.
- [ ] Run `npm run dev` and verify key endpoints (`/auth/login`, `/attendance/check-in`, `/attendance/summary`).
- [ ] Provision MongoDB indexes (handled automatically by Mongoose on first run, but confirm in production if schema changed).
- [ ] Share JWT secret + MongoDB credentials securely with the next maintainer.
- [ ] Document any third-party integrations (SMTP, monitoring) if you wire them up later.

---

With this document plus the inline comments across the route handlers, a new engineer should be able to trace any request end-to-end, enforce role-based access correctly, and evolve the attendance or leave workflows with confidence.


