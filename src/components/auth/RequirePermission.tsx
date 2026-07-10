import React from 'react';
import {getAppInfo} from '../../lib/httpClient';

// A small helper to safely parse JSON
function safeParse<T>(raw: string | null, fallback: T): T {
    try {
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

// The shape we expect based on src/lib/models.ts → UserPermissionResponse
// localStorage('perm') holds { permissions: string[] }
interface StoredPerm {
    permissions?: string[];
}

export type RequirePermissionProps = {
    // One or more permissions required to access this route
    anyOf?: string[];      // pass if user has ANY of these
    allOf?: string[];      // pass if user has ALL of these
    // Optional custom fallback UI (e.g., navigate or a component)
    fallback?: React.ReactNode;
    children: React.ReactNode;
};

export const RequirePermission: React.FC<RequirePermissionProps> = ({
                                                                        anyOf,
                                                                        allOf,
                                                                        fallback,
                                                                        children,
                                                                    }) => {
    const raw = getAppInfo('perm');
    const stored = safeParse<StoredPerm>(raw, { permissions: [] });
    const userPerms = new Set((stored.permissions || []).map((p) => p.toLowerCase()));

    const hasAny = (anyOf || []).some((p) => userPerms.has(p.toLowerCase()));
    const hasAll = (allOf || []).every((p) => userPerms.has(p.toLowerCase()));

    const allowed = (() => {
        if (anyOf && anyOf.length > 0) return hasAny;
        if (allOf && allOf.length > 0) return hasAll;
        // If nothing specified, default to deny for safety
        return false;
    })();

    if (!allowed) {
        return (
            <>
                {fallback ?? <AccessDenied />}
            </>
        );
    }

    return <>{children}</>;
};

export function hasPermission({anyOf, allOf}: { anyOf?: string[]; allOf?: string[] }): boolean {
    const raw = getAppInfo('perm');
    const stored = safeParse<StoredPerm>(raw, { permissions: [] });
    const userPerms = new Set((stored.permissions || []).map((p) => p.toLowerCase()));

    const hasAny = (anyOf || []).some((p: string) => userPerms.has(p.toLowerCase()));
    const hasAll = (allOf || []).every((p: string) => userPerms.has(p.toLowerCase()));

    if (anyOf && anyOf.length > 0) return hasAny;
    if (allOf && allOf.length > 0) return hasAll;
    // If nothing specified, default to deny for safety
    return false;
}


// A simple default Access Denied UI
export const AccessDenied: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-5 p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-20 p-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-80 mb-2">Access Denied</h2>
            <p className="text-gray-60 text-sm mb-6">
                You don’t have permission to access this page. If you believe this is a mistake, please contact an administrator.
            </p>
            <a href="/logout" className="inline-block px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">Go Home</a>
        </div>
    </div>
);
