import React from 'react';
import { checkRole } from '../../lib/checkPrivilege';
import { AccessDenied } from './RequirePermission';

export type RequireRoleProps = {
    role: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
};

export const RequireRole: React.FC<RequireRoleProps> = ({ role, fallback, children }) => {
    if (!checkRole(role)) {
        return <>{fallback ?? <AccessDenied />}</>;
    }

    return <>{children}</>;
};
