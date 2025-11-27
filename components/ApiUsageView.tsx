import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Spinner from './shared/Spinner';
import { useLocalization } from '../context/LocalizationContext';
import { DollarIcon } from './icons/DollarIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { ZapIcon } from './icons/ZapIcon';
import { ClockIcon } from './icons/ClockIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import * as userService from '../services/userService';

interface ApiUsageStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUSD: number;
    averageDurationMs: number;
    guestCalls: number;
    registeredCalls: number;
    byModel: Record<string, {
        calls: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        costUSD: number;
    }>;
    byEndpoint: Record<string, {
        calls: number;
        inputTokens: number;
        outputTokens: number;
        costUSD: number;
    }>;
    byBot: Record<string, {
        calls: number;
        inputTokens: number;
        outputTokens: number;
        costUSD: number;
    }>;
}

interface DailyUsage {
    date: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUSD: number;
}

interface TopUser {
    userId: string;
    email: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUSD: number;
}

interface Projections {
    baselinePeriod: {
        days: number;
        start: string;
        end: string;
    };
    daily: {
        avgCost: number;
        avgCalls: number;
        avgTokens: number;
    };
    monthly: {
        projectedCost: number;
        projectedCalls: number;
        projectedTokens: number;
    };
    breakdown: {
        byModel: ApiUsageStats['byModel'];
        byEndpoint: ApiUsageStats['byEndpoint'];
    };
}

type TimeRange = '7d' | '30d' | '90d' | 'custom';

export const ApiUsageView: React.FC = () => {
    const { t } = useLocalization();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ApiUsageStats | null>(null);
    const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [projections, setProjections] = useState<Projections | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deletingFailed, setDeletingFailed] = useState(false);
    
    // AI Provider Management
    const [providerConfig, setProviderConfig] = useState<userService.AIProviderConfig | null>(null);
    const [loadingProvider, setLoadingProvider] = useState(false);
    const [switchingProvider, setSwitchingProvider] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [targetProvider, setTargetProvider] = useState<'google' | 'mistral'>('google');

    useEffect(() => {
        fetchUsageData();
        fetchProviderConfig();
    }, [timeRange, startDate, endDate]);
    
    const fetchProviderConfig = async () => {
        setLoadingProvider(true);
        try {
            const config = await userService.getAIProviderConfig();
            setProviderConfig(config);
        } catch (err: any) {
            console.error('Failed to fetch AI provider config:', err);
        } finally {
            setLoadingProvider(false);
        }
    };
    
    const handleProviderSwitch = (newProvider: 'google' | 'mistral') => {
        setTargetProvider(newProvider);
        setShowConfirmDialog(true);
    };
    
    const confirmProviderSwitch = async () => {
        setSwitchingProvider(true);
        setShowConfirmDialog(false);
        try {
            await userService.setAIProvider(targetProvider);
            await fetchProviderConfig();
            alert(`Successfully switched to ${targetProvider === 'google' ? 'Google Gemini' : 'Mistral AI'}`);
        } catch (err: any) {
            console.error('Failed to switch provider:', err);
            alert(`Failed to switch provider: ${err.message || 'Unknown error'}`);
        } finally {
            setSwitchingProvider(false);
        }
    };

    const getDateRange = (): { start: string; end: string } => {
        const end = new Date();
        let start = new Date();

        switch (timeRange) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case 'custom':
                if (startDate && endDate) {
                    return { start: startDate, end: endDate };
                }
                start.setDate(end.getDate() - 30); // fallback
                break;
        }

        return { start: start.toISOString(), end: end.toISOString() };
    };

    const fetchUsageData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { start, end } = getDateRange();

            const [statsRes, dailyRes, topUsersRes, projectionsRes] = await Promise.all([
                apiFetch(`/api-usage/stats?startDate=${start}&endDate=${end}`),
                apiFetch(`/api-usage/daily?startDate=${start}&endDate=${end}`),
                apiFetch(`/api-usage/top-users?startDate=${start}&endDate=${end}&limit=10`),
                apiFetch('/api-usage/projections'),
            ]);

            setStats(statsRes.stats);
            setDailyUsage(dailyRes.daily);
            setTopUsers(topUsersRes.topUsers);
            setProjections(projectionsRes);
        } catch (err: any) {
            console.error('Failed to fetch API usage data:', err);
            setError(err.message || 'Failed to load usage data');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDuration = (ms: number): string => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const handleDeleteFailedCalls = async () => {
        if (!confirm('Are you sure you want to delete all failed API call records? This action cannot be undone.')) {
            return;
        }

        setDeletingFailed(true);
        try {
            const response = await apiFetch('/api-usage/failed', {
                method: 'DELETE',
            });

            alert(`Successfully deleted ${response.deletedCount} failed API call records.`);
            await fetchUsageData(); // Refresh the data
        } catch (err: any) {
            console.error('Failed to delete failed API calls:', err);
            alert(`Failed to delete failed API calls: ${err.message || 'Unknown error'}`);
        } finally {
            setDeletingFailed(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                    onClick={fetchUsageData}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* AI Provider Control Panel */}
            {providerConfig && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <ZapIcon className="w-6 h-6 text-yellow-500" />
                                AI Provider Management
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                                Switch between Google Gemini and Mistral AI without restarting
                            </p>
                        </div>
                        {providerConfig.lastUpdated && (
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                <p>Last updated: {new Date(providerConfig.lastUpdated).toLocaleString()}</p>
                                {providerConfig.lastUpdatedBy && <p>By: {providerConfig.lastUpdatedBy}</p>}
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Active Provider Card */}
                        <div className={`p-4 rounded-lg border-2 ${
                            providerConfig.activeProvider === 'google'
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500'
                                : 'bg-purple-100 dark:bg-purple-900/30 border-purple-500'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">Active Provider</h4>
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {providerConfig.activeProvider === 'google' ? 'Google Gemini' : 'Mistral AI'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Requests today: {providerConfig.usageToday[providerConfig.activeProvider]}
                            </p>
                        </div>
                        
                        {/* Google Provider Status */}
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">Google Gemini</h4>
                                {providerConfig.providerHealth.google.available ? (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XIcon className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <p className={`text-sm font-medium ${
                                providerConfig.providerHealth.google.available
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {providerConfig.providerHealth.google.available ? 'Available' : 'Unavailable'}
                            </p>
                            {providerConfig.providerHealth.google.error && (
                                <p className="text-xs text-red-500 mt-1">{providerConfig.providerHealth.google.error}</p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Today: {providerConfig.usageToday.google} requests
                            </p>
                            {providerConfig.activeProvider !== 'google' && (
                                <button
                                    onClick={() => handleProviderSwitch('google')}
                                    disabled={switchingProvider || !providerConfig.providerHealth.google.available}
                                    className="mt-3 w-full px-3 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {switchingProvider ? <Spinner /> : 'Switch to Google'}
                                </button>
                            )}
                        </div>
                        
                        {/* Mistral Provider Status */}
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">Mistral AI</h4>
                                {providerConfig.providerHealth.mistral.available ? (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XIcon className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <p className={`text-sm font-medium ${
                                providerConfig.providerHealth.mistral.available
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {providerConfig.providerHealth.mistral.available ? 'Available' : 'Unavailable'}
                            </p>
                            {providerConfig.providerHealth.mistral.error && (
                                <p className="text-xs text-red-500 mt-1">{providerConfig.providerHealth.mistral.error}</p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Today: {providerConfig.usageToday.mistral} requests
                            </p>
                            {providerConfig.activeProvider !== 'mistral' && (
                                <button
                                    onClick={() => handleProviderSwitch('mistral')}
                                    disabled={switchingProvider || !providerConfig.providerHealth.mistral.available}
                                    className="mt-3 w-full px-3 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {switchingProvider ? <Spinner /> : 'Switch to Mistral'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 border border-gray-300 dark:border-gray-700 shadow-xl rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">
                            Confirm Provider Switch
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to switch to <strong>{targetProvider === 'google' ? 'Google Gemini' : 'Mistral AI'}</strong>?
                            This will affect all new AI requests immediately.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-transparent border border-gray-400 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmProviderSwitch}
                                className="px-4 py-2 text-white bg-accent-primary rounded-lg hover:bg-accent-primary-hover"
                            >
                                Confirm Switch
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Time Range Selector */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex gap-2">
                    {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                timeRange === range
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-background-secondary text-content-primary hover:bg-background-tertiary'
                            }`}
                        >
                            {range === '7d' && 'Last 7 Days'}
                            {range === '30d' && 'Last 30 Days'}
                            {range === '90d' && 'Last 90 Days'}
                        </button>
                    ))}
                </div>

                {/* Delete Failed Calls Button */}
                {stats && stats.failedCalls > 0 && (
                    <button
                        onClick={handleDeleteFailedCalls}
                        disabled={deletingFailed}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={`Delete ${stats.failedCalls} Failed Calls`}
                    >
                        <DeleteIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">
                            {deletingFailed ? 'Deleting...' : `Delete ${stats.failedCalls} Failed Calls`}
                        </span>
                    </button>
                )}
                
                {timeRange === 'custom' && (
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="text-content-subtle">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded"
                        />
                    </div>
                )}
            </div>

            {/* Cost Projections Alert */}
            {projections && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <TrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                Cost Projections
                            </h3>
                            <div className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                <p>
                                    Based on the last 7 days, your projected monthly cost is{' '}
                                    <strong className="font-bold">
                                        {formatCurrency(projections.monthly.projectedCost)}
                                    </strong>
                                </p>
                                <p className="text-blue-600 dark:text-blue-300">
                                    Average: {formatCurrency(projections.daily.avgCost)}/day · {' '}
                                    {formatNumber(projections.daily.avgCalls)} calls/day
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Cost */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-content-subtle">Total Cost</p>
                            <p className="text-2xl font-bold text-content-primary">
                                {formatCurrency(stats.totalCostUSD)}
                            </p>
                        </div>
                        <DollarIcon className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                {/* Total Calls */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-content-subtle">API Calls</p>
                            <p className="text-2xl font-bold text-content-primary">
                                {formatNumber(stats.totalCalls)}
                            </p>
                            <p className="text-xs text-green-600">
                                {stats.successfulCalls} successful
                            </p>
                            {stats.failedCalls > 0 && (
                                <p className="text-xs text-red-600">
                                    {stats.failedCalls} failed
                                </p>
                            )}
                        </div>
                        <ActivityIcon className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                {/* Total Tokens */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-content-subtle">Total Tokens</p>
                            <p className="text-2xl font-bold text-content-primary">
                                {formatNumber(stats.totalTokens)}
                            </p>
                            <p className="text-xs text-content-subtle">
                                In: {formatNumber(stats.totalInputTokens)} · Out: {formatNumber(stats.totalOutputTokens)}
                            </p>
                        </div>
                        <ZapIcon className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                {/* Average Duration */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-content-subtle">Avg Response Time</p>
                            <p className="text-2xl font-bold text-content-primary">
                                {formatDuration(stats.averageDurationMs)}
                            </p>
                            <p className="text-xs text-content-subtle">
                                Guest: {stats.guestCalls} · Registered: {stats.registeredCalls}
                            </p>
                        </div>
                        <ClockIcon className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Model Breakdown */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Usage by Model</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-content-subtle">
                            <tr>
                                <th className="p-3">Model</th>
                                <th className="p-3 text-right w-24">Calls</th>
                                <th className="p-3 text-right w-32">Input Tokens</th>
                                <th className="p-3 text-right w-32">Output Tokens</th>
                                <th className="p-3 text-right w-24">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byModel).map(([model, data]) => (
                                <tr key={model} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-medium text-content-primary">{model}</td>
                                    <td className="p-3 text-right text-content-secondary w-24">{formatNumber(data.calls)}</td>
                                    <td className="p-3 text-right text-content-secondary w-32">{formatNumber(data.inputTokens)}</td>
                                    <td className="p-3 text-right text-content-secondary w-32">{formatNumber(data.outputTokens)}</td>
                                    <td className="p-3 text-right font-semibold text-content-primary w-24">{formatCurrency(data.costUSD)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Endpoint Breakdown */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Usage by Endpoint</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-content-subtle">
                            <tr>
                                <th className="p-3">Endpoint</th>
                                <th className="p-3 text-right w-24">Calls</th>
                                <th className="p-3 text-right w-32">Input Tokens</th>
                                <th className="p-3 text-right w-32">Output Tokens</th>
                                <th className="p-3 text-right w-24">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byEndpoint).map(([endpoint, data]) => (
                                <tr key={endpoint} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-medium text-content-primary">{endpoint}</td>
                                    <td className="p-3 text-right text-content-secondary w-24">{formatNumber(data.calls)}</td>
                                    <td className="p-3 text-right text-content-secondary w-32">{formatNumber(data.inputTokens)}</td>
                                    <td className="p-3 text-right text-content-secondary w-32">{formatNumber(data.outputTokens)}</td>
                                    <td className="p-3 text-right font-semibold text-content-primary w-24">{formatCurrency(data.costUSD)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Users */}
            {topUsers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-content-primary mb-4">Top Users by Cost</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-content-subtle">
                                <tr>
                                    <th className="p-3">Email</th>
                                    <th className="p-3 text-right w-24">Calls</th>
                                    <th className="p-3 text-right w-32">Tokens</th>
                                    <th className="p-3 text-right w-24">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {topUsers.map((user, index) => (
                                    <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3">
                                            <span className="font-medium text-content-primary">{user.email}</span>
                                            {index === 0 && <span className="ml-2 text-yellow-500">👑</span>}
                                        </td>
                                        <td className="p-3 text-right text-content-secondary w-24">{formatNumber(user.calls)}</td>
                                        <td className="p-3 text-right text-content-secondary w-32">{formatNumber(user.totalTokens)}</td>
                                        <td className="p-3 text-right font-semibold text-content-primary w-24">{formatCurrency(user.costUSD)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Daily Trend (Simple Table) */}
            {dailyUsage.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-content-primary mb-4">Daily Usage Trend</h3>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-content-subtle sticky top-0">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3 text-right w-24">Calls</th>
                                    <th className="p-3 text-right w-32">Tokens</th>
                                    <th className="p-3 text-right w-24">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {[...dailyUsage].reverse().map((day) => (
                                    <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 font-medium text-content-primary">{day.date}</td>
                                        <td className="p-3 text-right text-content-secondary w-24">{formatNumber(day.calls)}</td>
                                        <td className="p-3 text-right text-content-secondary w-32">{formatNumber(day.totalTokens)}</td>
                                        <td className="p-3 text-right font-semibold text-content-primary w-24">{formatCurrency(day.costUSD)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

