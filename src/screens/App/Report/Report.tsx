import React, {useMemo, useState} from 'react';
import { Calendar, Download } from 'lucide-react';
import { StatsCard } from '../../../components/card/StatsCard';
import {Sidebar} from "../../../components/Sidebar";
import {Header} from "../../../components/Header";
import {TransactionData} from "../../../lib/appModels.ts";
import {useOperatorMetrics} from "../../Admin/OperatorDetails/OperatorDetails.tsx";
import {
    buildQueryString,
    formatCompactNumber,
    formatCurrencyCompact,
    getDateParts,
    timeAgoFromMs
} from "../../../lib/utils.ts";
import {Button} from "../../../components/ui/button.tsx";
import {DataLoaderBoundary} from "../../../components/common/DataLoaderBoundary.tsx";
import {useDataLoader} from "../../../hooks/useDataLoader.ts";
import {fetchWinningTransactions} from "../../../lib/api.ts";
import {convertToCSV, convertToPDF} from "../../../components/reports/StakeReports.tsx";
import {downloadFile, downloadPDF} from "../../../components/download/Download.ts";
import {toPaginationMeta} from "../../../lib/pagination.ts";
import {Pagination} from "../../../components/common/Pagination.tsx";
import {useOperatorData} from "../Dashboard/Dashboard.tsx";


function useTransactionsReport(datePart: string, page: number, size: number, startDate?: string, endDate?: string, publicId?: string)
    : { data: any, loading: boolean, error: any, reload: any } {
    type OperatorsPayload = {
        page: number; size: number; totalPages: number; total: number; previous: number; next: number; data: TransactionData[]
    };

    const { from, to } = (datePart === 'Date Range') ? { from: startDate, to: endDate } : getDateParts(datePart);

    // @ts-ignore
    const params = useMemo(() => ({ publicId, page: page, size: size, status: '', sort: 'createdOn-desc', startDate: from.concat('T00:00:00Z'), endDate: to.concat('T23:59:59Z') }), [publicId, page, size, '', 'createdOn-desc', from, to]);

    return useDataLoader<OperatorsPayload, typeof params>(
        async (p, ) => {
            const qs = buildQueryString({ publicId: p.publicId, page: p.page, size: p.size,
                status: p.status === 'all' ? undefined : p.status, sort: p.sort,
                startDate: p.startDate, endDate: p.endDate });
            const resp = await fetchWinningTransactions(qs);
            const payload = resp?.data?.data as OperatorsPayload | undefined;
            if (!payload) throw new Error('Malformed response from server');
            return payload;
        },
        { params, preservePreviousData: true }
    );
}

const dateRanges = [
    {label: 'Select One', value: 'Date Range'},
    {label: 'This Week', value: 'THIS_WEEK'},
    {label: 'Last Week', value: 'LAST_WEEK'},
    {label: 'Last 7 Days', value: 'ONE_WEEK'},
    {label: 'This Month', value: 'THIS_MONTH'},
    {label: 'Last Month', value: 'LAST_MONTH'},
    {label: 'Last 30 days', value: 'MONTH_TO_DATE'}
   ];

export const Report: React.FC = () => {
    const operator = useOperatorData();
    // Server-side pagination state
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [dateRange, setDateRange] = useState("MONTH");
    const [customDR, setCustomDR] = useState({
        from: '',
        to: '',
    });
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        dateRange: 'MONTH'
    });
    const operatorSummary = useOperatorMetrics(operator?.publicId);
    const { data, loading, error, reload } = useTransactionsReport(dateRange, page, size, customDR.from, customDR.to, operator?.publicId);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


    const handleFilterChange = (filterType: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const applyFilters = () => {
        // Reset to the first page when filters are applied
        setDateRange(filters.dateRange);
        setCustomDR({ from: filters.fromDate, to: filters.toDate });
    };

    const handleExportCSV = () => {
        const csvContent = convertToCSV(transactions);
        const filename = `stakes-report-${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    };

    const handleExportPDF = () => {
        const pdfContent = convertToPDF(transactions);
        const filename = `stakes-report-${new Date().toISOString().split('T')[0]}.pdf`;
        downloadPDF(pdfContent, filename);
    };

    const transactions: TransactionData[] = data?.data ?? [];
    const meta = data ? toPaginationMeta(data as any) : { page, size, totalPages: 0, total: 0 };

    return (
        <div className="flex min-h-screen bg-gray-5">
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col">
                <Header title={'Gaming Reports'} />

                <div className="flex-1 bg-gray-50 p-8">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
                        <p className="text-gray-600">Check all Stakes and Winnings Reports here</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            title="Total Stakes Count"
                            value={formatCompactNumber(operatorSummary?.totalStakes || 0)}
                            change=""
                            changeType="positive"
                            period=""
                        />
                        <StatsCard
                            title="Total Stake Amount"
                            value={formatCurrencyCompact(operatorSummary?.totalStakesAmount || 0, 'NGN', { locale: 'en-NG' })}
                            change=""
                            changeType="positive"
                            period=""
                        />
                        <StatsCard
                            title="Total Winnings"
                            value={formatCompactNumber(operatorSummary?.totalWinnings || 0)}
                            change=""
                            changeType="positive"
                            period=""
                        />
                        <StatsCard
                            title="Total Winnings Amount"
                            value={formatCurrencyCompact(operatorSummary?.totalWinningAmount || 0, 'NGN', { locale: 'en-NG' })}
                            change=""
                            changeType="positive"
                            period=""
                        />
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Filters</h3>
                        <div className="flex flex-wrap items-center gap-4">
                            {/* From Date */}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="From Date"
                                />
                            </div>

                            {/* Separator */}
                            <span className="text-gray-400">-</span>

                            {/* To Date */}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="To Date"
                                />
                            </div>

                            {/* Date Range Preset */}
                            <select
                                value={filters.dateRange}
                                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                {dateRanges.map(dr => (
                                    // @ts-ignore
                                    <option key={dr.value} value={dr.value}>{dr.label}</option>
                                ))}
                            </select>

                            {/* Apply Filters Button */}
                            <button
                                onClick={applyFilters}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-500  text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <span>Apply Filters</span>
                            </button>

                            <br />
                        </div>
                    </div>

                    {/* Reports Table */}
                    <DataLoaderBoundary
                        loading={loading}
                        error={error}
                        isEmpty={!loading && !error && transactions?.length === 0}
                        emptyTitle="No tranactions found"
                        emptySubtitle="Try changing filters or check back later."
                        onRetry={reload}
                    >
                        <div className="bg-white rounded-xl border border-gray-20">
                            <div className="p-6 border-b border-gray-20">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-80">
                                        Reports
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button className="bg-primary-500 hover:bg-green-700 text-white h-12 px-6 rounded-full"
                                                onClick={handleExportCSV}
                                                type="button">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export CSV
                                        </Button>
                                        <Button variant="outline" className="h-10"
                                                onClick={handleExportPDF}
                                                type="button">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-5">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-60">
                                            Stake ID
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-60">
                                            Operator
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-60">
                                            Amount
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-60">
                                            Player
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-60">
                                            Game Played
                                        </th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-60">
                                            Date
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {transactions?.map((transaction, index) => (
                                        <tr key={index} className="border-b border-gray-20 hover:bg-gray-5 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-80">
                                                {transaction.referenceNumber || "Unknown Stake"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-60">
                                                {transaction.stakeRegistration?.operator?.name || "Unknown Operator"}
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-gray-80">
                                                {formatCurrencyCompact(transaction.amountWon, 'NGN', { locale: 'en-NG' }) }
                                            </td>
                                            <td className="p-4">
                                                {transaction.stakeRegistration?.customer?.name}
                                            </td>
                                            <td className="p-4">
                                                {transaction.stakeRegistration?.customer?.gamePlayed}
                                            </td>
                                            <td className="p-4 text-sm text-gray-60">
                                                {timeAgoFromMs(transaction.createdOn * 1000)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <Pagination
                                meta={{
                                    page: meta.page,
                                    size: meta.size,
                                    totalPages: meta.totalPages,
                                    total: meta.total,
                                }}
                                onPageChange={(p) => setPage(p)}
                                onPageSizeChange={(s) => { setPage(0); setSize(s); }}
                            />
                        </div>
                    </DataLoaderBoundary>
                </div>
            </div>
        </div>
    );
};