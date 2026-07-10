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
import { ApiError, deletePartnerAgreement, fetchPartnerAgreements } from '../../../lib/api';
import { PartnerAgreementData } from '../../../lib/appModels';
import { toPaginationMeta } from '../../../lib/pagination';
import { buildQueryString } from '../../../lib/utils';
import { PartnerAgreementFormDialog } from './PartnerAgreementFormDialog';

type AgreementsPayload = {
    page: number;
    size: number;
    totalPages: number;
    total: number;
    previous: number;
    next: number;
    data: PartnerAgreementData[];
};

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const PartnerAgreements = (): JSX.Element => {
    const toast = useToast();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sort, setSort] = useState('createdOn-desc');
    const [formOpen, setFormOpen] = useState(false);
    const [editingAgreement, setEditingAgreement] = useState<PartnerAgreementData | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PartnerAgreementData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const params = useMemo(() => ({ page, size, sort }), [page, size, sort]);
    const { data, loading, error, reload } = useDataLoader<AgreementsPayload, typeof params>(
        async (p) => {
            const qs = buildQueryString({ page: p.page, size: p.size, sort: p.sort });
            const resp = await fetchPartnerAgreements(qs);
            const payload = resp?.data?.data as AgreementsPayload | undefined;
            if (!payload) throw new Error('Malformed response from server');
            return payload;
        },
        { params, preservePreviousData: true }
    );

    const agreements = data?.data ?? [];
    const meta = data ? toPaginationMeta(data) : { page, size, totalPages: 0, total: 0 };

    const openCreate = () => {
        setEditingAgreement(null);
        setFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deletePartnerAgreement(deleteTarget.publicId);
            toast.show({ type: 'success', title: 'Agreement deleted', message: 'The partner agreement was deleted.' });
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
                <Header title="Partner Agreements" />
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-80 mb-2">Partner Agreements</h2>
                            <p className="text-gray-60">Manage contractual terms, dates, and linked SLAs</p>
                        </div>
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white" onClick={openCreate}>
                            <Plus className="w-4 h-4" />
                            Add Agreement
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
                                        <SelectItem value="createdOn-desc">Newest First</SelectItem>
                                        <SelectItem value="effectiveDate-desc">Effective Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-gray-60">
                                {loading ? 'Loading...' : `Showing ${agreements.length} of ${data?.total ?? 0} agreements`}
                            </div>
                        </div>
                    </div>

                    <DataLoaderBoundary
                        loading={loading}
                        error={error}
                        isEmpty={!loading && !error && agreements.length === 0}
                        emptyTitle="No agreements found"
                        emptySubtitle="Create an agreement after partners and SLAs are available."
                        onRetry={reload}
                    >
                        <div className="bg-white rounded-xl border border-gray-20">
                            <div className="p-6 border-b border-gray-20">
                                <h3 className="text-lg font-bold text-gray-80">All Agreements</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-5">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Partner</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Type</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Effective</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Expiry</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">SLA</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Status</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agreements.map((agreement) => (
                                            <tr key={agreement.publicId} className="border-b border-gray-20 hover:bg-gray-5 transition-colors">
                                                <td className="p-4 text-sm font-semibold text-gray-80">{agreement.partnerName || agreement.partnerPublicId}</td>
                                                <td className="p-4 text-sm text-gray-60">{agreement.agreementType?.replaceAll('_', ' ')}</td>
                                                <td className="p-4 text-sm text-gray-60">{agreement.effectiveDate || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">{agreement.expiryDate || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">{agreement.slaName || '-'}</td>
                                                <td className="p-4"><StatusBadge status={agreement.status} /></td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Edit agreement"
                                                            onClick={() => { setEditingAgreement(agreement); setFormOpen(true); }}
                                                        >
                                                            <Edit className="w-4 h-4 text-gray-60" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Delete agreement"
                                                            onClick={() => setDeleteTarget(agreement)}
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

            <PartnerAgreementFormDialog
                open={formOpen}
                agreement={editingAgreement}
                onOpenChange={setFormOpen}
                onSuccess={reload}
            />
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Agreement"
                description={`Delete the agreement for ${deleteTarget?.partnerName ?? 'this partner'}?`}
                confirmLabel="Delete"
                loading={deleting}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};
