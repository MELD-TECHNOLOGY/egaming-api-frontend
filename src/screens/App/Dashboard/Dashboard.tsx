import React, {useEffect, useMemo, useState} from "react";

import { Sidebar } from "../../../components/Sidebar";
import {Header} from "../../../components/Header";
import {StatsCard} from "../../../components/card/StatsCard.tsx";
import {
    MonthlyData,
    MonthlyType,
    OperatorData,
    OperatorSummary,
} from "../../../lib/appModels.ts";
import {fetchOperatorMetric, monthWiseMetrics} from "../../../lib/api.ts";
import {getInMemoryOperator} from "../../../lib/store.ts";
import {buildQueryString, formatCompactNumber, formatCurrencyCompact} from "../../../lib/utils.ts";
import {useDataLoader} from "../../../hooks/useDataLoader.ts";
import {GroupBarDatum, GroupedBarChart} from "../../../components/charts/GroupedBarChart.tsx";

export const useOperatorData = () : OperatorData | null | undefined => {
    const [operator, setOperator] = React.useState<OperatorData | null>();

    useEffect(() => {
        getInMemoryOperator()
            .then(resp =>
                // @ts-ignore
                setOperator(resp?.data))
    }, [setOperator]);

    return operator;
}

const useDashboardSummary = (operatorId: string): OperatorSummary | undefined => {
    const [summary, setSummary] = useState<OperatorSummary>();

    useEffect(() => {
        const getSummary = async () => {
            try {
                if(!operatorId) return;
                const response = await fetchOperatorMetric(operatorId);
                const data = await response?.data;
                if(data) setSummary(data?.data);
            } catch (error) {
                console.error('Error fetching dashboard summary:', error);
            }
        };
        getSummary();
    }, [operatorId, setSummary]);

    return summary;
}

function useMonthlyReport(rangeType: number, metricType: string, operatorId: string)
    : { data: any, loading: boolean, error: any, reload: any } {
    type MonthlyReportPayload = {
        status: string; message: string; data: MonthlyType
    };

    const date = new Date();

    const { from, to } = rangeType === 1 ? { from: `${date.getFullYear()}-07-01`, to: `${date.getFullYear()}-12-31` }
        : {from: `${date.getFullYear()}-01-01`, to: `${date.getFullYear()}-06-30`};

    const params = useMemo(() =>
        ({ from, to, metricType, operatorId }), [from, to, metricType, operatorId]);

    return useDataLoader<MonthlyReportPayload, typeof params>(
        async (p, ) => {
            const qs = buildQueryString({ metric: p.metricType, from: p.from.concat('T00:00:00Z'),
                to: p.to.concat('T23:59:59Z') });
            const resp = await monthWiseMetrics(qs);
            const payload = resp?.data as MonthlyReportPayload | undefined;
            if (!payload) throw new Error('Malformed response from server');
            return payload;
        },
        { params, preservePreviousData: true }
    );
}

export const Dashboard = (): JSX.Element => {
  const operator = useOperatorData();
  const dashboardSummary = useDashboardSummary(operator?.publicId || '');
  const [dateRange, setDateRange] = useState(0);
  const { data: stakeData, } = useMonthlyReport(dateRange, 'STAKES', operator?.publicId || '');
  const { data: winningData, } = useMonthlyReport(dateRange, 'WINNINGS', operator?.publicId || '');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const stakes = stakeData?.data?.data;
  const winnings = winningData?.data?.data;

    const reportData = (monthData: MonthlyData[]) : GroupBarDatum[] => {
        const groupData: GroupBarDatum[] = [];
        if(monthData) {
            monthData.forEach((md) => {
                groupData.push({
                    label: md.monthLabel,
                    count: md.values[0],
                    amount: md.values[1],
                });
            });
        }
        return groupData;
    }

  return (
    <div className="flex min-h-screen bg-gray-5">
      <Sidebar
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title={'My Dashboard'} />

        <div className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex-1 bg-gray-50 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                            <p className="text-gray-600">Overview of your game staking platform</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-sm">202.5</span>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatsCard
                        title="Total Stakes"
                        value={formatCompactNumber(dashboardSummary?.totalStakes || 0)}
                        change="1.6%"
                        changeType="positive"
                        period="Most Recent"
                    />
                    <StatsCard
                        title="Total Stakes Volume"
                        value={formatCurrencyCompact(dashboardSummary?.totalStakesAmount || 0, 'NGN', { locale: 'en-NG' })}
                        change="0.8%"
                        changeType="positive"
                        period="Most Recent"
                    />
                    <StatsCard
                        title="Total Winnings"
                        value={formatCompactNumber(dashboardSummary?.totalWinnings || 0)}
                        change="1.2%"
                        changeType="positive"
                        period="Most Recent"
                    />
                </div>

                {/* Charts */}
                <div className="bg-white rounded-xl border border-gray-20">
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Report For: </label>
                        <select onChange={(e) => //
                            setDateRange(parseInt(e.target.value))}
                                className="p-2 border border-gray-300 rounded-lg">
                            <option value="0">January to June</option>
                            <option value="1">July to December</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div style={{ width: '100%', maxWidth: 800 }}>
                        <GroupedBarChart
                            title="Stakes Data Over Time"
                            data={reportData(stakes)}
                            formatAmount={(v) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)}
                        />
                    </div>

                    <div style={{ width: '100%', maxWidth: 980 }}>
                        <GroupedBarChart
                            title="Winnings Data Over Time"
                            data={reportData(winnings)}
                            formatAmount={(v) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)}
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};