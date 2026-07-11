import { cn } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    VERIFIED: 'bg-green-100 text-green-800',
    SUCCESS: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    EXPIRED: 'bg-yellow-100 text-yellow-800',
    SUSPENDED: 'bg-orange-100 text-orange-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    TERMINATED: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-100 text-red-800',
    REVOKED: 'bg-red-100 text-red-800',
};

type StatusBadgeProps = {
    status?: string | boolean | null;
    className?: string;
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
    const label = typeof status === 'boolean' ? (status ? 'SUCCESS' : 'FAILED') : (status || 'UNKNOWN');
    const normalized = String(label).toUpperCase();

    return (
        <span className={cn(
            'inline-flex px-2 py-1 text-xs font-medium rounded-full',
            STATUS_COLORS[normalized] ?? 'bg-gray-100 text-gray-800',
            className
        )}>
            {normalized}
        </span>
    );
};
