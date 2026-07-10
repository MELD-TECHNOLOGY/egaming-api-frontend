import { FormEvent, useMemo, useState } from 'react';
import { Edit, Filter, Key, Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { deletePlatformPartner, fetchPlatformPartners, ApiError } from '../../../lib/api';
import { PlatformPartnerData } from '../../../lib/appModels';
import { toPaginationMeta } from '../../../lib/pagination';
import { buildQueryString, getAvatarBg, getInitials } from '../../../lib/utils';
import { PartnerFormDialog } from './PartnerFormDialog';

type PartnersPayload = {
    page: number;
    size: number;
    totalPages: number;
    total: number;
    previous: number;
    next: number;
    data: PlatformPartnerData[];
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : '-';

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const Partners = (): JSX.Element => {
    const toast = useToast();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [nameInput, setNameInput] = useState('');
    const [name, setName] = useState('');
    const [sort, setSort] = useState('createdOn-desc');
    const [formOpen, setFormOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<PlatformPartnerData | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PlatformPartnerData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const params = useMemo(() => ({ page, size, name, sort }), [page, size, name, sort]);
    const { data, loading, error, reload } = useDataLoader<PartnersPayload, typeof params>(
        async (p) => {
            const qs = buildQueryString({ page: p.page, size: p.size, name: p.name || undefined, sort: p.sort });
            const resp = await fetchPlatformPartners(qs);
            const payload = resp?.data?.data as PartnersPayload | undefined;
            if (!payload) throw new Error('Malformed response from server');
            return payload;
        },
        { params, preservePreviousData: true }
    );

    const partners = data?.data ?? [];
    const meta = data ? toPaginationMeta(data) : { page, size, totalPages: 0, total: 0 };

    const applySearch = (event: FormEvent) => {
        event.preventDefault();
        setPage(0);
        setName(nameInput.trim());
    };

    const openCreate = () => {
        setEditingPartner(null);
        setFormOpen(true);
    };

    const openEdit = (partner: PlatformPartnerData) => {
        setEditingPartner(partner);
        setFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deletePlatformPartner(deleteTarget.publicId);
            toast.show({
                type: 'success',
                title: 'Partner deactivated',
                message: 'The partner status was set to INACTIVE.',
            });
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
                <Header title="Partners" />
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-80 mb-2">Platform Partners</h2>
                            <p className="text-gray-60">Manage global partners and their integrations</p>
                        </div>
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white" onClick={openCreate}>
                            <Plus className="w-4 h-4" />
                            Add Partner
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-20 p-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-gray-60" />
                                    <span className="text-sm font-semibold text-gray-80">Filter by:</span>
                                </div>
                                <form onSubmit={applySearch} className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-40" />
                                        <input
                                            value={nameInput}
                                            onChange={(event) => setNameInput(event.target.value)}
                                            className="h-10 w-64 rounded-lg border border-gray-30 bg-gray-5 pl-9 pr-3 text-sm"
                                            placeholder="Search partner name"
                                        />
                                    </div>
                                    <Button type="submit" variant="outline" className="h-10">Search</Button>
                                </form>
                                <Select value={sort} onValueChange={(value) => { setPage(0); setSort(value); }}>
                                    <SelectTrigger className="w-48 h-10 bg-gray-5 border-gray-30 rounded-lg">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="createdOn-desc">Newest First</SelectItem>
                                        <SelectItem value="partnerName-asc">Name A-Z</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-gray-60">
                                {loading ? 'Loading...' : `Showing ${partners.length} of ${data?.total ?? 0} partners`}
                            </div>
                        </div>
                    </div>

                    <DataLoaderBoundary
                        loading={loading}
                        error={error}
                        isEmpty={!loading && !error && partners.length === 0}
                        emptyTitle="No partners found"
                        emptySubtitle="Add a partner or adjust your search."
                        onRetry={reload}
                    >
                        <div className="bg-white rounded-xl border border-gray-20">
                            <div className="p-6 border-b border-gray-20">
                                <h3 className="text-lg font-bold text-gray-80">All Partners</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-5">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Partner</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Type</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Country</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Contact</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Status</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Created</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partners.map((partner) => (
                                            <tr key={partner.publicId} className="border-b border-gray-20 hover:bg-gray-5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 ${getAvatarBg(partner.partnerName)} rounded-full flex items-center justify-center`}>
                                                            <span className="text-white font-bold text-sm">{getInitials(partner.partnerName)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-80 text-sm">{partner.partnerName}</p>
                                                            <p className="text-xs text-gray-60">{partner.partnerCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-80">{partner.partnerType?.replaceAll('_', ' ')}</td>
                                                <td className="p-4 text-sm text-gray-60">{partner.country || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">
                                                    <div>{partner.contactName || '-'}</div>
                                                    <div className="text-xs">{partner.contactEmail || '-'}</div>
                                                </td>
                                                <td className="p-4"><StatusBadge status={partner.status} /></td>
                                                <td className="p-4 text-sm text-gray-60">{formatDate(partner.createdOn)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(partner)} title="Edit partner">
                                                            <Edit className="w-4 h-4 text-gray-60" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => navigate('/admin/partners/api-key', { state: { partner } })}
                                                            title="Manage API key"
                                                        >
                                                            <Key className="w-4 h-4 text-gray-60" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteTarget(partner)} title="Deactivate partner">
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

            <PartnerFormDialog
                open={formOpen}
                partner={editingPartner}
                onOpenChange={setFormOpen}
                onSuccess={reload}
            />
            <ConfirmDialog
                open={!!deleteTarget}
                title="Deactivate Partner"
                description={`This sets ${deleteTarget?.partnerName ?? 'this partner'} to INACTIVE. The row may remain visible after reload.`}
                confirmLabel="Set INACTIVE"
                loading={deleting}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};
