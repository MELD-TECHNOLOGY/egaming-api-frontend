
# Global Partners Management — Implementation Plan

Source requirements: `prompts/v2/requirements.md` · API contract: `prompts/v2/openapi.yaml`

# Project Overview

`egaming-api-frontend` is a React 18 + Vite + TypeScript single-page application for an e-gaming platform, with two authenticated areas: a platform-admin console (`src/screens/Admin/`) and an operator app (`src/screens/App/`). This plan adds a **Global Partners Management** capability for platform admins, covering:

1. **Platform Partners** — full CRUD
2. **Service Level Agreements (SLAs)** — full CRUD
3. **Partner Agreements** — full CRUD, linking a Partner to an optional SLA
4. **License Audit Verification Requests** — paginated read-only list
5. **License Audit Verification Responses** — read-only, viewed per request
6. **Generate API Key for a Partner** — admin-only screen modeled on the existing operator API-key screen

All server contracts come from `prompts/v2/openapi.yaml` (Stake API Service — Management). All UI must follow the existing structure, Tailwind design tokens, and naming conventions.

# Current State Assessment

**Architecture (verified in code):**
- **Routing** — all routes declared in `src/App.tsx` (react-router v6 JSX style). Protected routes wrap elements in `<RequirePermission anyOf={[...]}>` (`src/components/auth/RequirePermission.tsx`), which checks permission strings stored in localStorage key `perm`. Role checks use `checkRole(role)` in `src/lib/checkPrivilege.ts` reading `profile.settings.role`; the admin role string is `"admin"` (there is no `PLATFORM_ADMIN`).
- **API layer** — `src/lib/httpClient.ts` (axios factory with bases `auth` / `api` / `apiV1`, bearer-token injection, GET retry with backoff, 401 → `auth:unauthorized` event, typed `ApiError`). `src/lib/api.ts` is a flat module: URL constants + one exported async function per endpoint. Platform endpoints use `{ base: 'api' }` → `VITE_API_BASE_URL`.
- **Types** — wire DTOs in `src/lib/models.ts` (incl. the paginated envelope `GenericResponse<T>`, which matches the openapi `PaginatedResponse` exactly); domain/UI types in `src/lib/appModels.ts` (incl. `FilterRequest`).
- **List screens** — canonical pattern is `src/screens/Admin/Operator/Operator.tsx`: page shell (`flex min-h-screen bg-gray-5` → `<Sidebar>` + `<Header>`), `useDataLoader` hook (`src/hooks/useDataLoader.ts`) + `buildQueryString` (`src/lib/utils.ts`), `<DataLoaderBoundary>`, plain Tailwind `<table>`, shared `<Pagination>` fed by `toPaginationMeta` (`src/lib/pagination.ts`), shadcn `<Select>` filters, lucide icons.
- **Forms** — manual `useState` per field, `<CInput>` (`src/components/form/CInput.tsx`) with composable validators from `src/components/form/validators.ts` (`required`, `email`, `minLen`, `maxLen`, `matches`), shadcn `<Dialog>` for modals (pattern in `src/screens/Team/Team.tsx`), `useToast()` feedback, `<LoadingButton>`.
- **API key screen** — `src/screens/App/ApiKeyManagement/ApiKeyManagement.tsx`: operator passed via router state, fetch-existing-key on mount (404 → "no key" state), Generate (`createApiKeyClient`) / Regenerate (`rotateApiKeyClient`), one-time-display warning banner, show/hide toggle, clipboard copy with `execCommand` fallback.
- **Sidebar** — `src/components/Sidebar/Sidebar.tsx`: static `navigationItems` array; a `useEffect` (lines 122–131) assigns each item's `access` from an **index-aligned parallel `privileges` array** (ids `settings`/`lga` skipped). No submenu support.

**What exists / what's missing:** No partner, SLA, agreement, license-audit, or verification-audit code exists in `src/` (filename and content search returned zero hits). All five screens, their API functions, and their types are greenfield. The only reusable adjacent feature is the operator API-key screen and the `/platform/api/v1/clients` endpoints.

# Identified Gaps

| # | Gap | Impact |
|---|-----|--------|
| G1 | No partner/SLA/agreement/verification types, API functions, screens, routes, or nav items | Entire feature is net-new |
| G2 | `openapi.yaml` contains **no API-key/clients endpoint**, yet requirements demand partner key generation | Must reuse existing `/platform/api/v1/clients` endpoints (see Assumptions) |
| G3 | No list endpoint for verification **responses** — only `GET /verification-requests/{publicId}/response` (404 when missing) | "Responses paginated list" is realized as the requests list + per-row lazy response viewer |
| G4 | No role-based route guard exists (only permission-string guard); no `CAN_VIEW_PARTNERS`-style permissions are granted by the auth server | Need a new `RequireRole` component; new permission strings would render screens permanently inaccessible |
| G5 | Sidebar permission gating is index-coupled (`privileges[index++]`) | New nav items must be added to the skip-list and gated separately or the existing mapping breaks |
| G6 | `ApiKeyRequest.role` is the literal type `'OPERATOR_API_USER'` (`src/lib/models.ts:278`) | Must be widened to admit a partner role value |
| G7 | No delete flow exists anywhere in the app yet | Delete-confirmation dialog is a new (but small) pattern built from shadcn `Dialog` |
| G8 | No zod/schema validation; openapi constraints must be hand-mapped to `validators.ts` rules | Validation mapping table provided per feature below |

# Risks and Assumptions

**Assumptions (confirm before/at implementation):**
- **A1 — Admin gating:** "Platform admin" = `profile.settings.role === 'admin'`. New screens are gated client-side with a new `RequireRole role="admin"` wrapper (mirroring `RequirePermission`), because the openapi spec enforces ADMIN authority server-side and no partner-specific permission strings exist in the auth server. Server 403s remain the real enforcement.
- **A2 — Partner API key:** partner key generation reuses the existing `/platform/api/v1/clients` endpoints with the **partner's `publicId`** and role **`PARTNER_API_USER`** (kept as a single module constant so it is a one-line change if the backend expects a different value).
- **A3 — PATCH semantics:** the spec reuses the full DTO for PATCH, so updates send the complete form state, not a diff.
- **A4 — Sorting:** sort strings follow the spec examples (`createdOn-desc`, `name-asc`, `requestDate-desc`).

**Risks:**

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Backend rejects `PARTNER_API_USER` role or partner `publicId` on `/clients` | Medium | Single `PARTNER_API_ROLE` constant; verify against a live backend early (Phase 3 of Feature 5); fall back to backend guidance |
| Sidebar `privileges` index misalignment breaks existing nav gating | Medium | Add new item ids to the skip-list; gate them by role in a separate pass after the loop |
| Auth server never returns role `admin` in some environments | Low | `RequireRole` renders the existing AccessDenied fallback; endpoints still 403 |
| Duplicate `partnerCode` (400) or invalid agreement dates (400) confuse users | Medium | Keep dialog open on 400, surface server `message` inline + toast |
| Partner/SLA dropdowns truncated on large datasets (page size cap) | Low now | Fetch `size=100` sorted by name; note follow-up for a searchable async select |

# Recommended Improvements

(Opportunistic, not blockers — see dedicated sections at the end for detail.)
- **Architecture:** begin grouping partner-domain API functions in a clearly delimited section of `api.ts`; extract a reusable `StatusBadge` and `ConfirmDialog` while building these five screens so future CRUD screens stop re-cloning table markup.
- **Security:** stop leaving `/app/developer` (existing API-key route) ungated — wrap the new partner key route in `RequireRole` from day one and flag the existing route as follow-up.
- **Reliability:** all mutations show toast + `reload()`; never mutate the local list optimistically (soft delete keeps rows visible with INACTIVE status).
- **Observability:** rely on existing `X-Request-Id` injection and `ApiError.requestId`; include `requestId` in error toasts for supportability where available.

# Feature Implementation Plan

> Shared foundation (used by every feature below, implemented once, first):
> 1. **Types** — append domain types to `src/lib/appModels.ts`: `PartnerType`, `PartnerStatus`, `AgreementType`, `AgreementStatus`, `SlaStatus` (string-literal unions matching the openapi enums), `PlatformPartnerData`, `ServiceLevelAgreementData`, `PartnerAgreementData`, `VerificationRequestData`, `VerificationResponseData` (mirroring the `*ResponseDto` schemas). Append request DTOs + single-item envelopes to `src/lib/models.ts`: `PlatformPartnerRequest`, `ServiceLevelAgreementRequest`, `PartnerAgreementRequest`, `PlatformPartnerResponse`, `ServiceLevelAgreementResponse`, `PartnerAgreementResponse`, `VerificationRequestResponse`, `VerificationResponseResponse`, `VoidDataResponse`. Widen `ApiKeyRequest.role` to `'OPERATOR_API_USER' | 'PARTNER_API_USER'`.
> 2. **API functions** — in `src/lib/api.ts` add URL constants `PARTNER_URL`, `SLA_URL`, `PARTNER_AGREEMENT_URL`, `VERIFICATION_REQUEST_URL` (all `/platform/api/v1/...`) and functions, all `{ base: 'api' }`, following `fetchOperators` style: `fetchPlatformPartners(qs)`, `fetchPlatformPartner(id)`, `createPlatformPartner(body)`, `updatePlatformPartner(id, body)` (httpPatch), `deletePlatformPartner(id)`; the same five for SLAs (`fetchServiceLevelAgreements` …) and Partner Agreements (`fetchPartnerAgreements` …); `fetchVerificationRequests(qs)`, `fetchVerificationRequest(id)`, `fetchVerificationResponse(id)` (GET `.../{id}/response`). Lists return `GenericResponse<T>`.
> 3. **Guard** — new `src/components/auth/RequireRole.tsx`: props `{ role, fallback?, children }`, uses `checkRole()`, renders the same AccessDenied card as `RequirePermission` (export/reuse it).
> 4. **Routes** — in `src/App.tsx`: `/admin/partners`, `/admin/partners/api-key`, `/admin/slas`, `/admin/partner-agreements`, `/admin/verification-audit`, each wrapped in `<RequireRole role="admin">`.
> 5. **Sidebar** — in `src/components/Sidebar/Sidebar.tsx`: append items `partners` (Handshake icon), `slas` (FileCheck), `partner-agreements` (FileSignature), `verification-audit` (ShieldCheck); add these ids to the `useEffect` skip-list so the existing `privileges` index mapping is untouched; after the loop set their `access = checkRole('admin')`. Extend `isActiveRoute` so `/admin/partners/api-key` highlights Partners.
> 6. **Page shell** — every screen clones the `Operator.tsx` shell: `flex min-h-screen bg-gray-5`, `<Sidebar>` + `<Header title=...>`, content in `flex-1 p-4 md:p-6 space-y-6`, cards `bg-white rounded-xl border border-gray-20`, `useDataLoader` + `<DataLoaderBoundary>` + Tailwind `<table>` + `<Pagination meta={toPaginationMeta(data)}>`.

---

## Feature: Platform Partners CRUD

### Objective
Let platform admins create, list, search, update, and soft-delete global platform partners.

### Business Value
Partners (Google, Meta, payment providers, ad networks…) are the root entity of the partner domain; agreements, SLAs-in-use, verification audits, and API keys all hang off a partner record.

### Requirements
- Paginated list with `page`, `size`, `name` search, `sort` (default `createdOn-desc`).
- Create and edit via the full `PlatformPartnerDto`; delete is a **soft delete** (server sets status `INACTIVE`).
- Admin-only (openapi: "Requires ADMIN authority" on all five endpoints).

### Technical Design
- **Files:** `src/screens/Admin/Partners/Partners.tsx` (list), `src/screens/Admin/Partners/PartnerFormDialog.tsx` (create/edit dialog, `mode` derived from presence of `partner` prop, prefill on open like `Team.tsx`).
- List state: `page`, `size` (10), `name` (applied on Enter / debounced), `sort` Select (`createdOn-desc`, `partnerName-asc`). Loader: `fetchPlatformPartners(buildQueryString({ page, size, name: name || undefined, sort }))`; payload `resp?.data?.data`.
- Columns: Partner (initials avatar via `getInitials`/`getAvatarBg` + name + code), Type, Country, Contact (name/email), Status badge, Created, Actions.
- Row actions: Pencil → edit dialog; Key → `navigate('/admin/partners/api-key', { state: { partner } })`; Trash2 → delete-confirm dialog. Header "Add Partner" button → create dialog. Success: toast + `reload()`.

### Data Model
`PlatformPartnerData` / `PlatformPartnerRequest` as in the shared foundation, mirroring `PlatformPartnerResponseDto` / `PlatformPartnerDto`.

### APIs
`GET/POST /platform/api/v1/partners`, `GET/PATCH/DELETE /platform/api/v1/partners/{publicId}` via the five `*PlatformPartner*` functions in `api.ts`.

### Security Controls
Route wrapped in `RequireRole role="admin"`; bearer token auto-injected by `httpClient`; server enforces ADMIN authority (401/403 → existing global handling).

### Validation Rules (openapi → `validators.ts`)
| Field | Control | Rules |
|---|---|---|
| partnerCode | CInput | `required()`, `maxLen(50)` |
| partnerName | CInput | `required()`, `maxLen(150)` |
| partnerType | Select (7 enum values) | required (block submit until chosen) |
| contactEmail | CInput type=email | optional; `email()` when non-empty |
| website | CInput type=url | optional; `matches(/^https?:\/\/\S+$/i)` when non-empty |
| country / contactName / contactPhone / userId | CInput | optional |
| status | Select (PENDING/ACTIVE/SUSPENDED/INACTIVE) | optional; default PENDING on create |

Strip empty-string optionals to `undefined` before submit.

### Error Handling
400 (invalid / **duplicate partnerCode**): keep dialog open, surface server `message` inline + toast. 404 on edit/delete: toast + `reload()`. Network errors: `DataLoaderBoundary` retry for the list, toast for mutations.

### Edge Cases
Soft delete — confirm-dialog copy states "sets status to INACTIVE"; row remains after reload with INACTIVE badge. PATCH sends the full DTO. Duplicate code on update also 400s.

### Performance Considerations
Server-side pagination; `preservePreviousData: true` on the loader to avoid table flicker; filter changes reset `page` to 0.

### Monitoring and Observability
Errors carry `requestId` via `ApiError`; include in error toasts where present.

### Test Scenarios
Create valid partner; create with duplicate code (400 kept-open dialog); invalid email/URL blocked client-side; search by name; paginate; edit prefill + save; soft delete → INACTIVE badge; non-admin direct URL → AccessDenied.

### Acceptance Criteria
- Admin can perform all CRUD operations against the live endpoints with correct payloads.
- All openapi field constraints enforced client-side before submit.
- List, filters, pagination, badges match existing Operator screen look and feel.

### Dependencies
Shared foundation (types, api, guard, routes, sidebar).

### Risks and Mitigations
Duplicate-code UX (mitigated above); large partner lists (server pagination).

### Implementation Tasks
- **Phase 1 – Analysis:** confirm sort keys accepted by backend; confirm status default on create.
- **Phase 2 – Design:** finalize columns/badge colors (PENDING yellow, ACTIVE green, SUSPENDED orange, INACTIVE gray — `getStatusColor` switch style from `Operator.tsx`).
- **Phase 3 – Development:** types → api fns → `Partners.tsx` → `PartnerFormDialog.tsx` → delete confirm.
- **Phase 4 – Testing:** scenarios above + `npx tsc --noEmit` + `npm run build`.
- **Phase 5 – Deployment:** ship behind admin role; no config changes.
- **Phase 6 – Monitoring:** watch 400/403 rates on partner endpoints; verify requestId propagation.

---

## Feature: Service Level Agreements CRUD

### Objective
Admin CRUD for SLAs that partner agreements can reference.

### Business Value
SLAs codify verification response-time commitments; agreements point at them, so they must exist before agreement linking works.

### Requirements
Paginated list (`page`, `size`, `sort`, default `name-asc` per spec example); create/edit/delete via `ServiceLevelAgreementDto`.

### Technical Design
**Files:** `src/screens/Admin/Slas/Slas.tsx`, `src/screens/Admin/Slas/SlaFormDialog.tsx`. Same list/dialog pattern as Partners. Columns: Name, Verification Response Time, Update Frequency, Status badge (ACTIVE green / INACTIVE gray), Created, Actions.

### Data Model
`ServiceLevelAgreementData` / `ServiceLevelAgreementRequest`.

### APIs
`GET/POST /platform/api/v1/slas`, `GET/PATCH/DELETE /platform/api/v1/slas/{publicId}`.

### Security Controls
`RequireRole role="admin"` (spec allows PARTNER_ADMIN too, but this console is admin-only per requirements).

### Validation Rules
| Field | Control | Rules |
|---|---|---|
| name | CInput | `required()`, `maxLen(150)` |
| verificationResponseTime | CInput type=number min=1 | `required()` + `matches(/^[1-9]\d*$/, 'Must be a whole number of at least 1')`; keep as string in state, `Number()` at submit |
| updateFrequency | Select DAILY/WEEKLY/MONTHLY | optional (spec: free string, example DAILY); omit when unset |
| status | Select ACTIVE/INACTIVE | optional; default ACTIVE on create |

### Error Handling
400 → inline + toast, dialog stays open; 404 on update/delete → toast + reload.

### Edge Cases
`verificationResponseTime = 0` or negative or decimal rejected client-side (spec minimum 1, int32). Full-DTO PATCH.

### Performance Considerations
Standard server-side pagination; nothing heavy.

### Monitoring and Observability
Same as Partners.

### Test Scenarios
Create with response time 0 (blocked) and 1 (accepted); edit; delete; paginate; sort by name.

### Acceptance Criteria
CRUD works end-to-end; constraint `minimum: 1` enforced; UI matches app conventions.

### Dependencies
Shared foundation.

### Risks and Mitigations
`updateFrequency` free-string vs Select mismatch — if backend stores other values, render unknown values as-is in the table; Select covers creation.

### Implementation Tasks
Phases 1–6 identical in shape to Partners (analysis of sort keys → design → build list+dialog → test → deploy → monitor).

---

## Feature: Partner Agreements CRUD

### Objective
Admin CRUD for agreements linking a partner (required) to an agreement type, effective/expiry dates, and an optional SLA.

### Business Value
Agreements are the contractual backbone connecting partners to service levels and data-sharing scope.

### Requirements
- Paginated list (`page`, `size`, `sort`, default `createdOn-desc`).
- **Partner field must be selected from existing partners; SLA field must be selected from existing SLAs** (explicit requirement — never free text).
- Create/edit/delete via `PartnerAgreementDto`.

### Technical Design
**Files:** `src/screens/Admin/PartnerAgreements/PartnerAgreements.tsx`, `src/screens/Admin/PartnerAgreements/PartnerAgreementFormDialog.tsx`.
- List columns: Partner (`partnerName` from response DTO), Type, Effective, Expiry, SLA (`slaName` or "—"), Status badge (DRAFT gray, ACTIVE green, EXPIRED yellow, TERMINATED red), Actions.
- Dialog loads dropdown options on open: `fetchPlatformPartners(buildQueryString({ page: 0, size: 100, sort: 'partnerName-asc' }))` and `fetchServiceLevelAgreements(buildQueryString({ page: 0, size: 100, sort: 'name-asc' }))` → `{publicId, label}` arrays into shadcn Selects keyed by `publicId`.
- SLA Select includes a leading `"none"` sentinel item ("No SLA") because shadcn Select cannot hold `""`; sentinel → omit `slaPublicId` from the request body.

### Data Model
`PartnerAgreementData` / `PartnerAgreementRequest`.

### APIs
`GET/POST /platform/api/v1/partner-agreements`, `GET/PATCH/DELETE /platform/api/v1/partner-agreements/{publicId}`.

### Security Controls
`RequireRole role="admin"`; server enforces ADMIN/PARTNER_ADMIN with partner scoping.

### Validation Rules
| Field | Control | Rules |
|---|---|---|
| partnerPublicId | Select of existing partners | required |
| agreementType | Select (DATA_SHARING/VERIFICATION_SERVICE/MARKETING/LICENSING) | required |
| effectiveDate | CInput type=date | `required()` |
| expiryDate | CInput type=date | optional; cross-field: if set, must be **after** effectiveDate |
| slaPublicId | Select of existing SLAs + "No SLA" | optional |
| signedDocumentUrl | CInput type=url | optional; URL `matches` rule |
| dataSharingScope | CInput | optional |
| status | Select (DRAFT/ACTIVE/EXPIRED/TERMINATED) | optional; default DRAFT on create |

### Error Handling
400 covers "invalid dates, or unresolved partner/SLA reference" — surface server message, keep dialog open. Dropdown load failure: disable submit, show retry within dialog.

### Edge Cases
`expiryDate <= effectiveDate` blocked client-side and server message surfaced as backstop; edit prefill maps `partnerPublicId`/`slaPublicId` back onto Selects; stale dropdowns (partner deleted since load) → server 400 surfaced; empty-string optionals stripped to `undefined`.

### Performance Considerations
Dropdown fetches capped at `size=100` (flag follow-up: searchable async select if partner count grows); options fetched only on dialog open, not on list render.

### Monitoring and Observability
Same as Partners.

### Test Scenarios
Create with partner+type+date only; create with SLA and expiry; expiry before effective blocked; "No SLA" omits field from payload (verify network tab); edit prefill; delete; pagination.

### Acceptance Criteria
Partner/SLA are select-only from live data; all openapi constraints enforced; list shows resolved `partnerName`/`slaName`.

### Dependencies
Shared foundation **plus** Partners and SLAs features (dropdown sources).

### Risks and Mitigations
Dropdown truncation at 100 (noted follow-up); date-only fields sent as `YYYY-MM-DD` (native date input format matches spec `format: date`).

### Implementation Tasks
Phases 1–6 as for Partners; Phase 3 ordered after Partners and SLAs are done.

---

## Feature: License Audit Verification Requests & Responses (read-only)

### Objective
Give admins a paginated audit trail of license verification requests, with on-demand viewing of each request's response.

### Business Value
Compliance/audit visibility into partner verification traffic without granting mutation capability.

### Requirements
- Paginated requests list (`page`, `size`, `sort`, default `requestDate-desc`).
- Response viewing per request (`GET /verification-requests/{publicId}/response`; 404 when no response recorded).
- Strictly read-only — no create/edit/delete anywhere in the UI (rule: admin can only use endpoints listed in openapi.yaml).

### Technical Design
**Files:** `src/screens/Admin/VerificationAudit/VerificationAudit.tsx`, `src/screens/Admin/VerificationAudit/VerificationResponseDialog.tsx`.
- List columns: Request ID, Invoice Number, Correlation ID, Partner Public ID, Request Date (`new Date(requestDate).toLocaleString()` — ISO date-time strings, not epoch).
- Row action Eye → "View Response" dialog; dialog fetches `fetchVerificationResponse(publicId)` in a `useEffect` on open with its own `Spinner`.
- 200: Success/Failed badge from boolean `status`, `message`, `responseDate`, and `responsePayload` pretty-printed: `<pre className="bg-gray-5 rounded-lg p-4 text-xs font-mono overflow-auto">{JSON.stringify(payload, null, 2)}</pre>`.
- 404: friendly empty state "No response has been recorded for this request yet."

### Data Model
`VerificationRequestData`, `VerificationResponseData` (read-only, no request DTOs).

### APIs
`GET /platform/api/v1/verification-requests`, `GET .../{publicId}`, `GET .../{publicId}/response`.

### Security Controls
`RequireRole role="admin"`; no mutation functions are created for these resources at all.

### Validation Rules
None (read-only). Query params validated by construction (`buildQueryString`).

### Error Handling
List errors → `DataLoaderBoundary` retry; dialog 404 → empty state (not an error toast); other dialog errors → inline error with retry button.

### Edge Cases
Response payload can be arbitrarily large/nested — scrollable `<pre>`; missing optional fields render "—"; cross-partner 404s handled same as missing-response.

### Performance Considerations
Response fetched lazily per user action only (one request per view, no N+1 on list render).

### Monitoring and Observability
Standard; nothing extra.

### Test Scenarios
Paginate/sort requests; view a response with payload; view a request with no response (404 empty state); non-admin blocked.

### Acceptance Criteria
Requests list paginates correctly; response dialog renders payload and handles 404 gracefully; zero mutation affordances present.

### Dependencies
Shared foundation only.

### Risks and Mitigations
"Responses paginated list" requirement has no backing list endpoint — satisfied via per-request viewer (documented in Gaps G3; confirm acceptable with product owner).

### Implementation Tasks
Phases 1–6; smallest feature, good candidate to build in parallel with SLAs.

---

## Feature: Generate API Key for Partner (Platform Admin)

### Objective
Admin selects a partner from the Partners list and generates/rotates an API key for it, on a screen mirroring the existing operator API-key screen.

### Business Value
Enables partner system integration credentials to be provisioned by the platform admin without backend intervention.

### Requirements
- Accessible **only** by platform admin.
- Entry: Key action on a partner row → dedicated screen.
- Behavior/styling mirrors `src/screens/App/ApiKeyManagement/ApiKeyManagement.tsx` (generate, regenerate, one-time display warning, show/hide, copy).

### Technical Design
**File:** `src/screens/Admin/Partners/PartnerApiKey.tsx`, route `/admin/partners/api-key`.
- `usePartnerFromRoute()` reads `location.state.partner as PlatformPartnerData`; if absent, `navigate('/admin/partners', { replace: true })` (mirrors `useOperatorFromRoute`, `ApiKeyManagement.tsx:12-26`).
- Mount: `fetchApiKeyClient(partner.publicId)`; 404 → "No API key available. Please generate one." + Generate button; existing key → masked display + Regenerate (`rotateApiKeyClient(partner.publicId)`).
- Generate builds `ApiKeyRequest`: `publicId: partner.publicId`, `name: partner.partnerName`, `apiKey: 'default'`, `role: PARTNER_API_ROLE` (module constant `'PARTNER_API_USER'`), same `rateLimitConfig` defaults (`{ remainingTokens: 50, capacity: 50, refillPeriod: 30, refillTimeUnit: 'SECOND' }`).
- Preserves one-time-display warning banner, eye show/hide toggle, clipboard copy with `execCommand` fallback, Active/Revoked badge. Header title "{partnerName} — Partner API Key" + "Back to Partners" link.

### Data Model
Reuses `ApiKeyRequest` (role union widened) and `ApiKeyData`/`ClientApiKey` (`src/lib/appModels.ts:149-175`). No new types.

### APIs
Existing: `fetchApiKeyClient`, `createApiKeyClient`, `rotateApiKeyClient` (`/platform/api/v1/clients...`). **Note:** these are not in `prompts/v2/openapi.yaml` — see Assumption A2.

### Security Controls
Route wrapped in `RequireRole role="admin"` (unlike the existing ungated `/app/developer` route — recommend gating that as follow-up). Key value never persisted client-side; shown once per generation per existing pattern.

### Validation Rules
None user-entered; partner identity comes from router state.

### Error Handling
Generation failure → error toast with server message; 404 on initial fetch is the expected "no key yet" state, not an error.

### Edge Cases
Direct URL hit without state → redirect to Partners; regenerate invalidates old key (warning copy retained); partner with status INACTIVE — allow but show status badge so admin sees context.

### Performance Considerations
Single-entity screen; trivial.

### Monitoring and Observability
Key generation is a security-sensitive action — server-side audit is assumed; client includes `X-Request-Id` automatically.

### Test Scenarios
Generate for keyless partner → one-time banner + copy works; refresh → masked key + Regenerate; rotate → new key shown once; direct URL without state → redirect; non-admin → AccessDenied.

### Acceptance Criteria
Admin can generate and rotate a partner key from the Partners list; UX matches the existing operator key screen; screen unreachable by non-admins.

### Dependencies
Partners feature (entry point); shared foundation; existing clients API functions.

### Risks and Mitigations
Backend contract for partner clients unverified (A2/G2) — verify first in development against a live backend; role value isolated in one constant.

### Implementation Tasks
- **Phase 1 – Analysis:** verify `/platform/api/v1/clients` accepts partner publicIds and the `PARTNER_API_USER` role (or obtain correct role string).
- **Phase 2 – Design:** confirm title/back-link and badge treatment.
- **Phase 3 – Development:** clone + adapt ApiKeyManagement; widen `ApiKeyRequest.role`; wire Key row action.
- **Phase 4 – Testing:** scenarios above.
- **Phase 5 – Deployment:** none special.
- **Phase 6 – Monitoring:** watch clients-endpoint 4xx after release.

---

# Recommended Architecture Improvements
- Extract shared `StatusBadge` (status→color map) and `ConfirmDialog` components while building these screens; five screens re-cloning the same table/badge/confirm markup is the moment to stop the copy-paste pattern.
- Keep partner-domain code in clearly delimited sections of `api.ts` / `models.ts` / `appModels.ts` (the flat-module convention is kept, but grouped, as a stepping stone toward per-domain modules).
- Replace the Sidebar's index-aligned `privileges` array with per-item `permissions`/`role` properties on `navigationItems` (follow-up; this plan only adds to the skip-list to avoid regressions).

# Security Recommendations
- Gate the existing `/app/developer` API-key route (currently unprotected) — follow-up.
- Client-side gating (`RequireRole`) is UX only; the ADMIN-authority enforcement in the API is the real control — never rely on hiding buttons.
- Do not log or persist generated API keys; retain the one-time-display pattern.
- Continue stripping unknown fields before submit; never echo raw server errors that could include payload data into persistent UI (toasts are transient).
- `.env` currently commits a server secret (`VITE_SERVER_SK`) — any `VITE_`-prefixed value ships to the browser; flag for rotation/move (pre-existing issue, out of scope here).

# Performance Recommendations
- Server-side pagination everywhere (already the pattern); `preservePreviousData` to avoid flicker; debounce name search.
- Lazy-load verification responses (implemented); lazy-load dropdown options on dialog open (implemented).
- Follow-up: searchable/async partner Select once partner count approaches the 100-item dropdown cap.

# Scalability Recommendations
- Sorting/filtering delegated to the API; no client-side sorting of paged data.
- Consider route-level code splitting (`React.lazy`) for the Admin partner-domain screens if bundle size grows — the app currently imports all screens eagerly in `App.tsx`.

# Operational Recommendations
- Verification: `npx tsc --noEmit` and `npm run build` must pass; manual E2E per feature test scenarios via `npm run dev` against a live backend with an admin profile.
- Roll out sidebar items last in the implementation order so partially built screens are never navigable.
- Error toasts should include `requestId` when present to correlate with server logs.

# Implementation Roadmap

**Phase 1 – Foundation:** types (`appModels.ts`, `models.ts` incl. `ApiKeyRequest.role` widening) → API functions (`api.ts`) → `RequireRole.tsx` → routes in `App.tsx`.
**Phase 2 – Core Features:** Partners list + form dialog + delete confirm → SLAs list + form dialog → Verification Audit list + response dialog (parallelizable with SLAs).
**Phase 3 – Integration:** Partner Agreements (consumes Partners + SLAs dropdowns) → Partner API Key screen (verify clients-endpoint contract first) → Sidebar items + `isActiveRoute` (added last).
**Phase 4 – Hardening:** edge-case passes (soft delete copy, 400 dialog-stays-open, date cross-validation, "No SLA" omission, 404 response empty state); non-admin AccessDenied checks; empty-string→undefined sweep.
**Phase 5 – Production Readiness:** `tsc --noEmit` + `vite build` clean; full manual E2E checklist per feature; confirm A1/A2 assumptions against the live backend.
**Phase 6 – Optimization:** extract `StatusBadge`/`ConfirmDialog`; debounced/searchable partner select; Sidebar gating refactor; gate `/app/developer`.

