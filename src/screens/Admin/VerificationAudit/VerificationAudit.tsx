import { useMemo, useState } from 'react';
import { Eye, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { DataLoaderBoundary } from '../../../components/common/DataLoaderBoundary';
import { Pagination } from '../../../components/common/Pagination';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { fetchVerificationRequests } from '../../../lib/api';
import { VerificationRequestData } from '../../../lib/appModels';
import { toPaginationMeta } from '../../../lib/pagination';
import { buildQueryString } from '../../../lib/utils';
import { VerificationResponseDialog } from './VerificationResponseDialog';

type VerificationPayload = {
    page: number;
    size: number;
    totalPages: number;
    total: number;
    previous: number;
    next: number;
    data: VerificationRequestData[];
};

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';

export const VerificationAudit = (): JSX.Element => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sort, setSort] = useState('requestDate-desc');
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    const params = useMemo(() => ({ page, size, sort }), [page, size, sort]);
    const { data, loading, error, reload } = useDataLoader<VerificationPayload, typeof params>(
        async (p) => {
            const qs = buildQueryString({ page: p.page, size: p.size, sort: p.sort });
            const resp = await fetchVerificationRequests(qs);
            const payload = resp?.data?.data as VerificationPayload | undefined;
            if (!payload) throw new Error('Malformed response from server');
            return payload;
        },
        { params, preservePreviousData: true }
    );

    const requests = data?.data ?? [];
    const meta = data ? toPaginationMeta(data) : { page, size, totalPages: 0, total: 0 };

    return (
        <div className="flex min-h-screen bg-gray-5">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 flex flex-col">
                <Header title="Verification Audit" />
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-80 mb-2">License Verification Audit</h2>
                            <p className="text-gray-60">Review verification requests and recorded responses</p>
                        </div>
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
                                        <SelectItem value="requestDate-desc">Newest Request</SelectItem>
                                        <SelectItem value="requestDate-asc">Oldest Request</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-gray-60">
                                {loading ? 'Loading...' : `Showing ${requests.length} of ${data?.total ?? 0} requests`}
                            </div>
                        </div>
                    </div>

                    <DataLoaderBoundary
                        loading={loading}
                        error={error}
                        isEmpty={!loading && !error && requests.length === 0}
                        emptyTitle="No verification requests found"
                        emptySubtitle="Verification audit records will appear here."
                        onRetry={reload}
                    >
                        <div className="bg-white rounded-xl border border-gray-20">
                            <div className="p-6 border-b border-gray-20">
                                <h3 className="text-lg font-bold text-gray-80">Verification Requests</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-5">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Request ID</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Invoice Number</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Correlation ID</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Partner Public ID</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Request Date</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-60">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((request) => (
                                            <tr key={request.publicId} className="border-b border-gray-20 hover:bg-gray-5 transition-colors">
                                                <td className="p-4 text-sm font-semibold text-gray-80">{request.requestId || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">{request.invoiceNumber || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">{request.correlationId || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">{request.partnerPublicId || '-'}</td>
                                                <td className="p-4 text-sm text-gray-60">{formatDateTime(request.requestDate)}</td>
                                                <td className="p-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        title="View response"
                                                        onClick={() => setSelectedRequestId(request.publicId)}
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-60" />
                                                    </Button>
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

            <VerificationResponseDialog
                open={!!selectedRequestId}
                requestPublicId={selectedRequestId}
                onOpenChange={(open) => !open && setSelectedRequestId(null)}
            />
        </div>
    );
};
