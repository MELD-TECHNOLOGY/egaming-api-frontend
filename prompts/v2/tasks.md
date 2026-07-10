# Project Task List — Global Partners Management

## Overview

- Source Plan: `prompts/v2/plan.md` (requirements: `prompts/v2/requirements.md`, contract: `prompts/v2/openapi.yaml`)
- Generated On: 2026-07-10
- Methodology: Phase-based decomposition; each task single-objective, independently verifiable, dependency-ordered
- Granularity: Implementable by one engineer or AI agent per task
- Confirmed constraints (former assumptions A1–A4): admin gating via `profile.settings.role === 'admin'` with new `RequireRole` wrapper; partner API keys reuse `/platform/api/v1/clients` with partner `publicId` and role `PARTNER_API_USER` (single module constant); PATCH sends the full DTO; sort strings follow spec examples (`createdOn-desc`, `name-asc`, `requestDate-desc`).

---

# Phase 1 – Discovery and Analysis

1. [*] Review `prompts/v2/requirements.md` and `prompts/v2/openapi.yaml`; confirm every endpoint the UI will call is listed in the spec (plus the existing `/platform/api/v1/clients` endpoints per confirmed assumption A2). Deliverable: endpoint-to-screen mapping notes.
2. [*] Re-read the canonical list-screen pattern in `src/screens/Admin/Operator/Operator.tsx` (shell, `useDataLoader`, `buildQueryString`, `DataLoaderBoundary`, `Pagination`/`toPaginationMeta`, `getStatusColor`) to anchor all new screens. Acceptance: pattern checklist captured for reuse in Phases 2 and 5.
3. [*] Re-read the dialog form pattern in `src/screens/Team/Team.tsx` (shadcn `Dialog`, `CInput` + `validators.ts`, prefill-on-open, `useToast`, `LoadingButton`).
4. [*] Re-read `src/screens/App/ApiKeyManagement/ApiKeyManagement.tsx` (router-state entry, 404 → "no key" state, generate/rotate, one-time-display banner, show/hide, clipboard fallback) as the template for the partner key screen.
5. [*] Document the Sidebar `privileges` index-coupling in `src/components/Sidebar/Sidebar.tsx` (useEffect lines ~122–131) and the exact skip-list mechanism, so new items cannot break existing gating (Gap G5).
6. [*] Map every openapi field constraint to `validators.ts` rules per the plan's per-feature validation tables (partners, SLAs, agreements). Deliverable: validation mapping confirmed against `prompts/v2/openapi.yaml` schemas.

---

# Phase 2 – Architecture and Design

1. [*] Define the domain type design: string-literal unions `PartnerType`, `PartnerStatus`, `AgreementType`, `AgreementStatus`, `SlaStatus` and data shapes `PlatformPartnerData`, `ServiceLevelAgreementData`, `PartnerAgreementData`, `VerificationRequestData`, `VerificationResponseData` mirroring the openapi `*ResponseDto` schemas. Deliverable: type signatures matching `prompts/v2/openapi.yaml` exactly.
2. [*] Define the request/envelope type design for `src/lib/models.ts`: `PlatformPartnerRequest`, `ServiceLevelAgreementRequest`, `PartnerAgreementRequest`, single-item envelopes (`PlatformPartnerResponse`, `ServiceLevelAgreementResponse`, `PartnerAgreementResponse`, `VerificationRequestResponse`, `VerificationResponseResponse`), and `VoidDataResponse`; plan the widening of `ApiKeyRequest.role` to `'OPERATOR_API_USER' | 'PARTNER_API_USER'` (Gap G6).
3. [*] Design `src/components/auth/RequireRole.tsx` — props `{ role, fallback?, children }`, uses `checkRole()` from `src/lib/checkPrivilege.ts`, renders the same AccessDenied card as `RequirePermission` (export/reuse it rather than duplicating markup) (Gap G4).
4. [*] Design the route map for `src/App.tsx`: `/admin/partners`, `/admin/partners/api-key`, `/admin/slas`, `/admin/partner-agreements`, `/admin/verification-audit`, each wrapped in `<RequireRole role="admin">`.
5. [*] Design the Sidebar additions: items `partners` (Handshake), `slas` (FileCheck), `partner-agreements` (FileSignature), `verification-audit` (ShieldCheck); ids added to the skip-list; `access = checkRole('admin')` set after the privileges loop; `isActiveRoute` extended so `/admin/partners/api-key` highlights Partners.
6. [*] Design shared components `StatusBadge` (status→color map: PENDING yellow, ACTIVE green, SUSPENDED orange, INACTIVE gray; DRAFT gray, EXPIRED yellow, TERMINATED red) and `ConfirmDialog` (first delete flow in the app — Gap G7), built from shadcn `Dialog` in the `Operator.tsx` badge style.
7. [*] Design the Partner Agreements dialog data flow: dropdown options fetched on dialog open (`fetchPlatformPartners` size=100 sorted `partnerName-asc`; `fetchServiceLevelAgreements` size=100 sorted `name-asc`), SLA Select with a `"none"` sentinel ("No SLA") that omits `slaPublicId` from the payload, cross-field rule `expiryDate > effectiveDate`.
8. [*] Design the Verification Audit read-only flow: requests list (default sort `requestDate-desc`) plus lazy per-row response dialog (`GET .../{publicId}/response`, 404 → friendly empty state, payload in scrollable `<pre>` with `JSON.stringify(payload, null, 2)`) (Gap G3).

---

# Phase 3 – Data and Infrastructure

1. [*] Append the domain types and enum unions from design task 2.1 to `src/lib/appModels.ts` in a clearly delimited partner-domain section. Validation: `npx tsc --noEmit` passes.
2. [*] Append the request DTOs and single-item response envelopes from design task 2.2 to `src/lib/models.ts`, reusing the existing `GenericResponse<T>` paginated envelope for lists. Validation: `npx tsc --noEmit` passes.
3. [*] Widen `ApiKeyRequest.role` (`src/lib/models.ts:278`) to `'OPERATOR_API_USER' | 'PARTNER_API_USER'` and confirm no existing call sites break. Validation: `npx tsc --noEmit` passes; `fetchApiKeyClient`/`createApiKeyClient`/`rotateApiKeyClient` call sites unchanged.

---

# Phase 4 – Backend Implementation (API Client Integration Layer)

> No server-side work — contracts are fixed by `prompts/v2/openapi.yaml`. This phase implements the API integration layer in `src/lib/api.ts`, all `{ base: 'api' }`, following the `fetchOperators` style.

1. [*] Add URL constants `PARTNER_URL`, `SLA_URL`, `PARTNER_AGREEMENT_URL`, `VERIFICATION_REQUEST_URL` (all under `/platform/api/v1/...`) in a delimited partner-domain section of `src/lib/api.ts`.
2. [*] Implement Platform Partner API functions: `fetchPlatformPartners(qs)`, `fetchPlatformPartner(id)`, `createPlatformPartner(body)`, `updatePlatformPartner(id, body)` (httpPatch, full DTO), `deletePlatformPartner(id)`. Lists return `GenericResponse<PlatformPartnerData>`.
3. [*] Implement SLA API functions: `fetchServiceLevelAgreements(qs)`, `fetchServiceLevelAgreement(id)`, `createServiceLevelAgreement(body)`, `updateServiceLevelAgreement(id, body)`, `deleteServiceLevelAgreement(id)`.
4. [*] Implement Partner Agreement API functions: `fetchPartnerAgreements(qs)`, `fetchPartnerAgreement(id)`, `createPartnerAgreement(body)`, `updatePartnerAgreement(id, body)`, `deletePartnerAgreement(id)`.
5. [*] Implement read-only Verification API functions: `fetchVerificationRequests(qs)`, `fetchVerificationRequest(id)`, `fetchVerificationResponse(id)` (GET `.../{id}/response`). No mutation functions for these resources (requirements rule).
6. [*] Verify the full API layer compiles and typing round-trips (`GenericResponse<T>` envelopes, `VoidDataResponse` on deletes). Validation: `npx tsc --noEmit` passes.

---

# Phase 5 – Frontend Implementation

> Order: guard + routes → Partners → SLAs → Verification Audit (parallelizable with SLAs) → Partner Agreements (needs Partners + SLAs) → Partner API Key (needs Partners) → Sidebar last so partially built screens are never navigable.

1. [*] Implement `src/components/auth/RequireRole.tsx` per design task 2.3, exporting/reusing the AccessDenied card from `RequirePermission.tsx`. Acceptance: non-admin sees AccessDenied; admin sees children.
2. [*] Register the five routes in `src/App.tsx` wrapped in `<RequireRole role="admin">` per design task 2.4.
3. [*] Implement shared `ConfirmDialog` component (title, body copy, destructive confirm button, loading state) from shadcn `Dialog`.
4. [*] Implement shared `StatusBadge` component with the status→color map from design task 2.6.
5. [*] Implement `src/screens/Admin/Partners/Partners.tsx` list screen: Operator.tsx shell; state `page`/`size=10`/`name` (debounced or Enter-applied)/`sort` Select (`createdOn-desc`, `partnerName-asc`); loader `fetchPlatformPartners(buildQueryString({...}))` with `preservePreviousData: true`, payload `resp?.data?.data`; columns Partner (initials avatar via `getInitials`/`getAvatarBg` + name + code), Type, Country, Contact, Status badge, Created, Actions; filter changes reset `page` to 0.
6. [*] Implement `src/screens/Admin/Partners/PartnerFormDialog.tsx` (create/edit; `mode` from presence of `partner` prop; prefill on open): fields per validation table — `partnerCode` required+maxLen(50), `partnerName` required+maxLen(150), `partnerType` required Select (7 enum values), `contactEmail` optional email, `website` optional URL `matches(/^https?:\/\/\S+$/i)`, optional `country`/`contactName`/`contactPhone`/`userId`, `status` Select default PENDING; strip empty-string optionals to `undefined`; on 400 (incl. duplicate `partnerCode`) keep dialog open with inline server `message` + toast; success → toast + `reload()`.
7. [*] Wire Partners row actions: Pencil → edit dialog; Key → `navigate('/admin/partners/api-key', { state: { partner } })`; Trash2 → `ConfirmDialog` with copy stating soft delete "sets status to INACTIVE"; header "Add Partner" button → create dialog.
8. [*] Implement `src/screens/Admin/Slas/Slas.tsx` list (default sort `name-asc`; columns Name, Verification Response Time, Update Frequency, Status badge ACTIVE green / INACTIVE gray, Created, Actions; render unknown `updateFrequency` values as-is).
9. [*] Implement `src/screens/Admin/Slas/SlaFormDialog.tsx`: `name` required+maxLen(150); `verificationResponseTime` CInput type=number, required + `matches(/^[1-9]\d*$/)` (string in state, `Number()` at submit — blocks 0/negative/decimal per spec minimum 1); `updateFrequency` optional Select DAILY/WEEKLY/MONTHLY (omit when unset); `status` optional Select default ACTIVE; same 400/404 handling as Partners; delete via `ConfirmDialog`.
10. [*] Implement `src/screens/Admin/VerificationAudit/VerificationAudit.tsx` read-only list (default sort `requestDate-desc`; columns Request ID, Invoice Number, Correlation ID, Partner Public ID, Request Date via `new Date(requestDate).toLocaleString()`; Eye row action only — zero mutation affordances).
11. [*] Implement `src/screens/Admin/VerificationAudit/VerificationResponseDialog.tsx`: fetch `fetchVerificationResponse(publicId)` in `useEffect` on open with own `Spinner`; 200 → Success/Failed badge from boolean `status`, `message`, `responseDate`, payload pretty-printed in scrollable `<pre className="bg-gray-5 rounded-lg p-4 text-xs font-mono overflow-auto">`; 404 → "No response has been recorded for this request yet." empty state (not an error toast); other errors → inline error with retry; missing optional fields render "—".
12. [*] Implement `src/screens/Admin/PartnerAgreements/PartnerAgreements.tsx` list (default sort `createdOn-desc`; columns Partner (`partnerName`), Type, Effective, Expiry, SLA (`slaName` or "—"), Status badge DRAFT gray / ACTIVE green / EXPIRED yellow / TERMINATED red, Actions). Dependency: Partners and SLAs features complete.
13. [*] Implement `src/screens/Admin/PartnerAgreements/PartnerAgreementFormDialog.tsx`: load partner/SLA options on dialog open per design task 2.7 (Selects keyed by `publicId`; never free text); fields — `partnerPublicId` required Select, `agreementType` required Select (DATA_SHARING/VERIFICATION_SERVICE/MARKETING/LICENSING), `effectiveDate` required date input, `expiryDate` optional date with cross-field "after effectiveDate" rule, `slaPublicId` optional Select with "No SLA" sentinel omitting the field, `signedDocumentUrl` optional URL, `dataSharingScope` optional, `status` Select default DRAFT; dropdown load failure → disable submit + in-dialog retry; edit prefill maps ids back onto Selects; 400 (invalid dates / unresolved references, incl. stale dropdowns) keeps dialog open with server message.
14. [*] Implement `src/screens/Admin/Partners/PartnerApiKey.tsx` at `/admin/partners/api-key`, cloned/adapted from `ApiKeyManagement.tsx`: `usePartnerFromRoute()` reading `location.state.partner` (absent → `navigate('/admin/partners', { replace: true })`); mount `fetchApiKeyClient(partner.publicId)` (404 = expected "No API key available. Please generate one."); Generate builds `ApiKeyRequest` with `publicId: partner.publicId`, `name: partner.partnerName`, `apiKey: 'default'`, `role: PARTNER_API_ROLE` module constant (`'PARTNER_API_USER'`), existing `rateLimitConfig` defaults; Regenerate via `rotateApiKeyClient`; preserve one-time-display warning banner, show/hide toggle, clipboard copy with `execCommand` fallback, Active/Revoked badge; header "{partnerName} — Partner API Key" + "Back to Partners" link; show partner status badge (INACTIVE partners still allowed).
15. [*] Add the four Sidebar items per design task 2.5 (skip-list ids + post-loop `access = checkRole('admin')` + `isActiveRoute` extension). Do this LAST. Acceptance: existing nav gating unchanged for all pre-existing items.

---

# Phase 6 – Security and Hardening

1. [*] Verify all five new routes reject non-admin users: direct URL access as a non-admin profile renders AccessDenied on each route.
2. [*] Verify the Verification Audit screens expose zero mutation affordances and no mutation API functions exist for verification resources (requirements rule: admin uses only endpoints listed in openapi.yaml).
3. [*] Sweep all three form dialogs for empty-string optionals — confirm they are stripped to `undefined` before submit (verify in network tab).
4. [*] Verify the partner API key is never persisted or logged client-side; one-time-display pattern intact after generate and rotate.
5. [*] Confirm error toasts include `ApiError.requestId` where available for server-log correlation, and that raw server payload data is never echoed into persistent UI.
6. [*] Verify mutations never optimistically mutate local lists — every success path is toast + `reload()`; soft-deleted partners remain visible with INACTIVE badge.
7. [*] Record follow-up item: gate the existing ungated `/app/developer` API-key route with `RequireRole` (out of scope for this feature; flagged in plan's Security Recommendations).
8. [*] Record follow-up item: `.env` ships `VITE_SERVER_SK` to the browser — flag for rotation/relocation (pre-existing issue, out of scope).

---

# Phase 7 – Testing and Quality Assurance

1. [*] Run `npx tsc --noEmit` — zero errors.
2. [*] Run `npm run build` — clean production build.
3. [ ] Partners E2E (via `npm run dev` + live backend + admin profile): create valid partner; duplicate `partnerCode` → 400 keeps dialog open with inline message; invalid email/URL blocked client-side; search by name; paginate; edit prefill + save (full-DTO PATCH); soft delete → row remains with INACTIVE badge.
4. [ ] SLAs E2E: create with response time 0 (blocked client-side) and 1 (accepted); decimal/negative blocked; edit; delete; paginate; sort by name.
5. [ ] Partner Agreements E2E: create with partner+type+effectiveDate only; create with SLA and expiry; expiry ≤ effective blocked client-side; "No SLA" omits `slaPublicId` from payload (verify in network tab); edit prefill maps Selects; delete; paginate.
6. [ ] Verification Audit E2E: paginate/sort requests; view a response with payload (pretty-printed, scrollable); view a request with no response → 404 empty state, no error toast.
7. [ ] Partner API Key E2E: generate for keyless partner → one-time banner + copy works; refresh → masked key + Regenerate; rotate → new key shown once; direct URL without router state → redirect to Partners. Early in this pass, verify the live backend accepts partner `publicId` + `PARTNER_API_USER` on `/platform/api/v1/clients` (contract risk from Gap G2 — role isolated in the `PARTNER_API_ROLE` constant if a change is needed).
8. [ ] Access-control pass: repeat one representative flow per screen as a non-admin — AccessDenied everywhere; server 403s handled by existing global handling.
9. [ ] Regression pass: existing Operator list, Team dialogs, operator API-key screen, and all pre-existing Sidebar items behave unchanged.
10. [ ] Verify each feature's acceptance criteria from `prompts/v2/plan.md` and check off against this list.

---

# Phase 8 – Deployment and Release

1. [*] Confirm no environment-variable or configuration changes are required (all new endpoints ride the existing `VITE_API_BASE_URL` / `{ base: 'api' }`).
2. [*] Merge in dependency order (foundation → screens → sidebar last) so no partially built screen is ever navigable in a deployed build.
3. [ ] Produce the production build and deploy through the existing release process; smoke-test the five routes post-deploy with an admin profile.
4. [*] Verify rollback path: feature is purely additive — confirm reverting the merge restores prior behavior with no data/config migration.

---

# Phase 9 – Monitoring and Operations

1. [ ] Watch 400/403 rates on `/platform/api/v1/partners`, `/slas`, `/partner-agreements`, `/verification-requests` after release; investigate spikes (duplicate-code UX, stale dropdown references).
2. [ ] Watch 4xx on `/platform/api/v1/clients` after release for partner-key generation failures (contract risk G2).
3. [ ] Verify `X-Request-Id` propagation end-to-end: trigger a controlled error and correlate the toast's `requestId` with server logs.
4. [ ] Confirm server-side audit logging captures partner API key generation/rotation events (security-sensitive action; server-owned).

---

# Phase 10 – Documentation and Knowledge Transfer

1. [*] Document the partner-domain additions (types/API sections, `RequireRole`, `StatusBadge`, `ConfirmDialog`, routes, sidebar gating approach) in the project docs/CLAUDE.md so future screens follow the same pattern.
2. [*] Record the confirmed constraints (former assumptions A1–A4) and the G3 decision (verification responses viewed per-request, no list endpoint) for product/QA reference.
3. [*] Log follow-up backlog items: searchable async partner Select (100-item dropdown cap), Sidebar per-item `permissions`/`role` refactor, gate `/app/developer`, `VITE_SERVER_SK` rotation, route-level code splitting for admin partner screens.
4. [*] Mark completed tasks in this file (`[ ]` → `[*]`) as execution proceeds.
