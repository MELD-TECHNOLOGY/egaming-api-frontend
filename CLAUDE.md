# Global Partners Management Notes

## Partner Domain Additions

- Domain response types and enums live in `src/lib/appModels.ts` under the partner-domain section.
- Request DTOs and response envelopes live in `src/lib/models.ts`.
- API helpers live in `src/lib/api.ts` and use `{ base: 'api' }`, so they ride the existing `VITE_API_BASE_URL`.
- CRUD resources:
  - Partners: `/platform/api/v1/partners`
  - SLAs: `/platform/api/v1/slas`
  - Partner Agreements: `/platform/api/v1/partner-agreements`
- Verification audit is read-only:
  - Requests list/detail: `/platform/api/v1/verification-requests`
  - Response detail: `/platform/api/v1/verification-requests/{publicId}/response`

## Admin Access

- Admin-only routes use `src/components/auth/RequireRole.tsx`.
- `RequireRole` checks `profile.settings.role` through `checkRole('admin')`.
- It reuses the exported `AccessDenied` component from `RequirePermission.tsx`.

## Shared UI

- `src/components/common/StatusBadge.tsx` maps partner, SLA, agreement, and API-key statuses to existing pill badge colors.
- `src/components/common/ConfirmDialog.tsx` wraps the shadcn dialog primitives for destructive confirmation flows.
- Mutation success paths should show a toast and call `reload()` rather than optimistically editing local lists.
- Mutation error toasts should include `ApiError.requestId` when available.

## Routes and Screens

- `/admin/partners` -> `src/screens/Admin/Partners/Partners.tsx`
- `/admin/partners/api-key` -> `src/screens/Admin/Partners/PartnerApiKey.tsx`
- `/admin/slas` -> `src/screens/Admin/Slas/Slas.tsx`
- `/admin/partner-agreements` -> `src/screens/Admin/PartnerAgreements/PartnerAgreements.tsx`
- `/admin/verification-audit` -> `src/screens/Admin/VerificationAudit/VerificationAudit.tsx`

## Sidebar Gating

- `src/components/Sidebar/Sidebar.tsx` still has an index-aligned permission array for existing navigation.
- New partner-domain item ids (`partners`, `slas`, `partner-agreements`, `verification-audit`) are skipped by that loop.
- Those new items are assigned access separately with `checkRole('admin')`.
- `/admin/partners/api-key` highlights the Partners sidebar item through the `/admin/partners` active-route prefix.

## Confirmed Constraints

- Platform admin is represented by `profile.settings.role === 'admin'`.
- Partner API keys reuse `/platform/api/v1/clients` with the partner `publicId`.
- The partner API-key role is isolated as `PARTNER_API_USER` in `PartnerApiKey.tsx`.
- PATCH sends the full DTO form state.
- Sort strings follow the spec examples: `createdOn-desc`, `name-asc`, and `requestDate-desc`.
- Verification responses are viewed per request because there is no standalone response-list endpoint.

## Backlog

- Replace the 100-item partner/SLA dropdown cap with searchable async selects.
- Refactor sidebar gating to per-item `permissions` or `role` metadata instead of an index-aligned array.
- Gate the existing `/app/developer` operator API-key route.
- Rotate and relocate `VITE_SERVER_SK`; Vite exposes `VITE_*` values to the browser.
- Consider route-level code splitting for the admin partner screens.
