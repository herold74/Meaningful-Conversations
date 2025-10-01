import React, { useState, useEffect, useCallback } from 'react';
import { User, UpgradeCode } from '../types';
import { apiFetch } from '../services/api';
import { useLocalization } from '../context/LocalizationContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { BOTS } from '../constants';

const AdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useLocalization();
    const [users, setUsers] = useState<User[]>([]);
    const [codes, setCodes] = useState<UpgradeCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBotId, setSelectedBotId] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Assuming these admin endpoints exist
            const [usersData, codesData] = await Promise.all([
                apiFetch('/admin/users'),
                apiFetch('/admin/codes')
            ]);
            setUsers(usersData.users || []);
            setCodes(codesData.codes || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch admin data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Set a default bot for the code generation dropdown
        const unlockableBots = BOTS.filter(b => b.accessTier === 'premium' || b.accessTier === 'registered');
        if (unlockableBots.length > 0) {
            setSelectedBotId(unlockableBots[0].id);
        }
    }, []);

    const handleRoleChange = async (userId: string, role: 'isBetaTester' | 'isAdmin', value: boolean) => {
        try {
            const updatedUserResponse = await apiFetch(`/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ [role]: value }),
            });
            setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUserResponse.user } : u));
        } catch (err: any) {
            setError(err.message || `Failed to update user ${userId}.`);
        }
    };

    const handleGenerateCode = async () => {
        if (!selectedBotId) return;
        try {
            await apiFetch('/admin/codes', {
                method: 'POST',
                body: JSON.stringify({ botId: selectedBotId, count: 1 }),
            });
            fetchData(); // Refresh codes list
        } catch (err: any) {
            setError(err.message || 'Failed to generate code.');
        }
    };

    const unlockableBots = BOTS.filter(b => b.accessTier === 'premium' || b.accessTier === 'registered');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner />
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-4xl mx-auto p-8 space-y-8 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('admin_title')}</h1>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}

            {/* User Management */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('admin_users_title')}</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_users_email')}</th>
                                <th className="px-4 py-2 text-center text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_users_beta')}</th>
                                <th className="px-4 py-2 text-center text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_users_admin')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{user.email}</td>
                                    <td className="px-4 py-2 text-center">
                                        <input type="checkbox" checked={user.isBetaTester} onChange={e => handleRoleChange(user.id, 'isBetaTester', e.target.checked)} className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 cursor-pointer" />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <input type="checkbox" checked={user.isAdmin} onChange={e => handleRoleChange(user.id, 'isAdmin', e.target.checked)} className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 cursor-pointer" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Code Management */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('admin_codes_title')}</h2>
                <div className="flex gap-4 mb-4">
                    <select value={selectedBotId} onChange={e => setSelectedBotId(e.target.value)} className="p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500">
                        {unlockableBots.map(bot => (
                            <option key={bot.id} value={bot.id}>{bot.name}</option>
                        ))}
                    </select>
                    <button onClick={handleGenerateCode} className="px-4 py-2 text-sm font-bold text-black bg-green-400 uppercase hover:bg-green-500">
                        {t('admin_codes_generate')}
                    </button>
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="min-w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                         <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_codes_code')}</th>
                                <th className="px-4 py-2 text-left text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_codes_bot')}</th>
                                <th className="px-4 py-2 text-left text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_codes_status')}</th>
                                <th className="px-4 py-2 text-left text-sm font-bold text-gray-600 dark:text-gray-300">{t('admin_codes_used_by')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {codes.map(code => {
                                const bot = BOTS.find(b => b.id === code.botId);
                                return (
                                <tr key={code.id}>
                                    <td className="px-4 py-2 font-mono text-gray-800 dark:text-gray-200">{code.code}</td>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{bot?.name || code.botId}</td>
                                    <td className="px-4 py-2">
                                        {code.isUsed
                                            ? <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-full">{t('admin_codes_used')}</span>
                                            : <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 rounded-full">{t('admin_codes_available')}</span>
                                        }
                                    </td>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{code.usedBy?.email || '---'}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminView;
