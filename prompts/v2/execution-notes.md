# Global Partners Management Execution Notes

## Phase 1 Discovery

### Endpoint-to-screen mapping

| Screen | Endpoint(s) | Notes |
| --- | --- | --- |
| Platform Partners | `GET/POST /platform/api/v1/partners`, `GET/PATCH/DELETE /platform/api/v1/partners/{publicId}` | Admin-only in the spec; delete is soft delete to `INACTIVE`. |
| Service Level Agreements | `GET/POST /platform/api/v1/slas`, `GET/PATCH/DELETE /platform/api/v1/slas/{publicId}` | Spec allows admin and partner admin; UI requirement gates to platform admin. |
| Partner Agreements | `GET/POST /platform/api/v1/partner-agreements`, `GET/PATCH/DELETE /platform/api/v1/partner-agreements/{publicId}` | Partner and SLA values must be selected from existing records. |
| Verification Audit | `GET /platform/api/v1/verification-requests`, `GET /platform/api/v1/verification-requests/{publicId}`, `GET /platform/api/v1/verification-requests/{publicId}/response` | Read-only. No standalone response list endpoint exists, so responses are viewed per request. |
| Partner API Key | Existing `/platform/api/v1/clients` helpers | OpenAPI does not list this endpoint; task plan confirms reuse with partner `publicId` and `PARTNER_API_USER`. |

### Existing implementation patterns

- List screens use the `Operator.tsx` shell: `Sidebar`, `Header`, `useDataLoader`, `buildQueryString`, `DataLoaderBoundary`, plain Tailwind tables, `Pagination`, and `toPaginationMeta`.
- Dialog flows should follow the shadcn `Dialog` usage in `Team.tsx`, with field state initialized before opening and cleared/updated on close.
- API key generation should follow `ApiKeyManagement.tsx`: route-state source entity, 404 as expected missing-key state, generate/rotate actions, one-time display warning, show/hide, and clipboard fallback.
- `Sidebar.tsx` mutates a module-level `navigationItems` array from an index-aligned `privileges` array. New role-gated items must be skipped by that index loop and assigned access separately.
- Validation maps directly to `validators.ts`: `required`, `email`, `maxLen`, and `matches`. Optional fields must not run validators when empty.

## Phase 2 Design

### Domain types

- `PartnerType`: `GOOGLE`, `META`, `APPLE`, `PAYMENT_PROVIDER`, `SOCIAL_MEDIA`, `APP_STORE`, `AD_NETWORK`
- `PartnerStatus`: `PENDING`, `ACTIVE`, `SUSPENDED`, `INACTIVE`
- `AgreementType`: `DATA_SHARING`, `VERIFICATION_SERVICE`, `MARKETING`, `LICENSING`
- `AgreementStatus`: `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`
- `SlaStatus`: `ACTIVE`, `INACTIVE`
- Response DTOs mirror OpenAPI `*ResponseDto` schemas exactly and live in `appModels.ts`; request/envelope types live in `models.ts`.

### Guard and routing

- `RequireRole` will use `checkRole(role)` and reuse the exported `AccessDenied` component from `RequirePermission.tsx`.
- New route paths for Phase 5 are `/admin/partners`, `/admin/partners/api-key`, `/admin/slas`, `/admin/partner-agreements`, and `/admin/verification-audit`, all wrapped with `RequireRole role="admin"`.

### Shared UI components

- `StatusBadge` should accept a status string and use Tailwind classes matching existing pill badges: green for active/success, yellow for pending/expired, orange for suspended, gray for inactive/draft, red for terminated.
- `ConfirmDialog` should wrap shadcn `Dialog` with title, body copy, cancel, destructive confirm, and loading states.

### Agreement dialog data flow

- Load partner options from `fetchPlatformPartners(buildQueryString({ page: 0, size: 100, sort: 'partnerName-asc' }))`.
- Load SLA options from `fetchServiceLevelAgreements(buildQueryString({ page: 0, size: 100, sort: 'name-asc' }))`.
- Use a `"none"` Select sentinel for omitted `slaPublicId`.
- Client-side block when `expiryDate` is present and not after `effectiveDate`.

### Verification audit flow

- The requests list defaults to `requestDate-desc`.
- Response viewing is lazy per row through `fetchVerificationResponse(publicId)`.
- 404 on response fetch is a friendly empty state, not a toastable error.

## Validation Notes

- `npx tsc --noEmit` is currently unavailable because this package does not declare or install `typescript`; `npx` resolves to npm's placeholder package instead of a compiler.
- `npx -p typescript tsc --noEmit` succeeds using a one-off compiler install without changing package files.
- `npm run build` succeeds.
- Phase 7 automated rerun: `npx -p typescript tsc --noEmit` succeeds and `npm run build` succeeds. Plain `npx tsc --noEmit` remains blocked by missing local `typescript`.

## Phase 7 E2E Blocker

- Tasks 7.3 through 7.10 require a running live backend, admin/non-admin profiles, and stateful browser/network-tab verification. Those credentials and backend state are not available in this workspace, so the automated portion stops at task 7.2.

## Phase 8 Release Notes

- No new environment variables are required. New partner-domain endpoints use the existing `VITE_API_BASE_URL` through API helpers configured with `{ base: 'api' }`.
- Partner API key generation reuses the existing `/platform/api/v1/clients` helper and existing API base configuration.
- Local implementation followed the dependency order from the task plan: foundation/types/API, route guard/shared UI, screens, then sidebar.
- Production deployment is handled by `.github/workflows/production.yml` on the `production` branch or `workflow_dispatch`; this workspace cannot trigger or verify that deployment.
- Rollback is source-additive: reverting the feature changes removes new routes, screens, sidebar entries, shared components, and partner-domain API/types without data or config migration.

## Phase 9 Monitoring Blocker

- Post-release monitoring tasks require production deployment, access to server metrics/logs, and backend audit logs. Those external systems are not available in this workspace.

## Phase 6 Hardening Notes

- The five new admin routes are wrapped in `RequireRole role="admin"` in `src/App.tsx`.
- Verification Audit is read-only: UI exposes only an Eye action and no verification mutation API helpers were added.
- Empty-string optionals are stripped through `cleanOptional` in partner, SLA, and agreement form dialogs before submit.
- Partner API keys are held only in component state and shown/copyable only immediately after generate or rotate.
- New mutation error toasts include `ApiError.requestId` when available.
- New mutation success paths call `reload()` rather than optimistically editing local list data.
- Follow-up: gate the pre-existing `/app/developer` operator API-key route.
- Follow-up: rotate/relocate the pre-existing browser-exposed `VITE_SERVER_SK`.
