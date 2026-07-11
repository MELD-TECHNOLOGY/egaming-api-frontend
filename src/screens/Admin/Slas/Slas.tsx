import { useMemo, useState } from 'react';
import { Edit, Filter, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { DataLoaderBoundary } from '../../../components/common/DataLoaderBoundary';
import { Pagination } from '../../../components/common/Pagination';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { useToast } from '../../../components/feedback/Toast';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { ApiError, deleteServiceLevelAgreement, fetchServiceLevelAgreements } from '../../../lib/api';
import { ServiceLevelAgreementData } from '../../../lib/appModels';
import { toPaginationMeta } from '../../../lib/pagination';
import { buildQueryString } from '../../../lib/utils';
import { SlaFormDialog } from './SlaFormDialog';

type SlasPayload = {
    page: number;
    size: number;
    totalPages: number;
    total: number;
    previous: number;
    next: number;
    data: ServiceLevelAgreementData[];
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : '-';

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const Slas = (): JSX.Element => {
    const toast = useToast();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sort, setSort] = useState('name-asc');
    const [formOpen, setFormOpen] = useState(false);
    const [editingSla, setEditingSla] = useState<ServiceLevelAgreementData | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceLevelAgreementData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const params = useMemo(() => ({ page, size, sort }), [page, size, sort]);
    const { data, loading, error, reload } = useDataLoader<SlasPayload, typeof params>(
        async (p) => {
            const qs = buildQueryString({ page: p.page, size: p.size, sort: p.sort });
            const resp = await fetchServiceLevelAgreements(qs);
            const payload = resp?.data?.data as SlasPayload | undefined;
            if (!payload) throw new Error('Malformed response from server');
            return payload;
        },
        { params, preservePreviousData: true }
    );

    const slas = data?.data ?? [];
    const meta = data ? toPaginationMeta(data) : { page, size, totalPages: 0, total: 0 };

    const openCreate = () => {
        setEditingSla(null);
        setFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteServiceLevelAgreement(deleteTarget.publicId);
            toast.show({ type: 'success', title: 'SLA deleted', message: 'The SLA was deleted.' });
            setDeleteTarget(null);
            reload();
        } catch (deleteError) {
            toast.show({ type: 'error', title: 'Delete failed', message: toErrorMessage(deleteError) });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-5">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 flex flex-col">
                <Header title="SLAs" />
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-80 mb-2">Service Level Agreements</h2>
                            <p className="text-gray-60">Manage verification response-time commitments</p>
                        </div>
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white" onClick={openCreate}>
                            <Plus className="w-4 h-4" />
                            Add SLA
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-20 p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-gray-60" />
                                    <span className="text-sm font-semibold text-gray-80">Sort by:</span>
                                </div>
                                <Select value={sort} onValueChange={(value) => { setPage(0); setSort(value); }}>
                                    <SelectTrigger className="w-48 h-10 bg-gray-5 border-gray-30 rounded-lg">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                                        <SelectItem value="createdOn-desc">Newest First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-gray-60">
                                {loading ? 'Loading...' : `Showing ${slas.length} of ${data?.total ?? 0} SLAs`}
                            </div>
                        </div>
                    </div>

                    <DataLoaderBoundary
                        loading={loading}
                        error={error}
                        isEmpty={!loading && !error && slas.length === 0}
                        emptyTitle="No SLAs found"
                        emptySubtitle="Create an SLA to link it to partner agreements."
                        onRetry={reload}
                    >
                        <div className="bg-white rounded-xl border border-gray-20">
                            <div className="p-6 border-b border-gray-20">
                                <h3 className="text-lg font-bold text-gray-80">All SLAs</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-5">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Name</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Verification Response Time</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Update Frequency</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Status</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Created</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slas.map((sla) => (
                                            <tr key={sla.publicId} className="border-b border-gray-20 hover:bg-gray-5 transition-colors">
                                                <td className="p-4 text-sm font-semibold text-gray-80">{sla.name}</td>
                                                <td className="p-4 text-sm text-gray-60">{sla.verificationResponseTime}</td>
                                                <td className="p-4 text-sm text-gray-60">{sla.updateFrequency || '-'}</td>
                                                <td className="p-4"><StatusBadge status={sla.status} /></td>
                                                <td className="p-4 text-sm text-gray-60">{formatDate(sla.createdOn)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Edit SLA"
                                                            onClick={() => { setEditingSla(sla); setFormOpen(true); }}
                                                        >
                                                            <Edit className="w-4 h-4 text-gray-60" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Delete SLA"
                                                            onClick={() => setDeleteTarget(sla)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                meta={{ page: meta.page, size: meta.size, totalPages: meta.totalPages, total: meta.total }}
                                onPageChange={(nextPage) => setPage(nextPage)}
                                onPageSizeChange={(nextSize) => { setPage(0); setSize(nextSize); }}
                            />
                        </div>
                    </DataLoaderBoundary>
                </div>
            </div>

            <SlaFormDialog open={formOpen} sla={editingSla} onOpenChange={setFormOpen} onSuccess={reload} />
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete SLA"
                description={`Delete ${deleteTarget?.name ?? 'this SLA'}? Agreements that reference it may be affected by backend rules.`}
                confirmLabel="Delete"
                loading={deleting}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};
