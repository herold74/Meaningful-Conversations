import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as userService from '../services/userService';
import { User, UpgradeCode, Ticket } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { BOTS } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { UsersIcon } from './icons/UsersIcon';
import { KeyIcon } from './icons/KeyIcon';
import { InboxIcon } from './icons/InboxIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { XIcon } from './icons/XIcon';
import { StarIcon } from './icons/StarIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { WarningIcon } from './icons/WarningIcon';

interface AdminViewProps {
    onBack: () => void;
}

type AdminTab = 'users' | 'codes' | 'tickets';

const ResetPasswordSuccessModal: React.FC<{
    data: { email: string; newPass: string };
    onClose: () => void;
}> = ({ data, onClose }) => {
    const { t } = useLocalization();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(data.newPass).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const description = t('admin_reset_success_desc', { email: data.email });

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white dark:bg-gray-900 w-full max-w-md p-6 border border-gray-300 dark:border-gray-700 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">{t('admin_reset_success_title')}</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        {description}
                    </p>
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                        <span className="font-mono text-lg text-gray-800 dark:text-gray-200">{data.newPass}</span>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-400"
                        >
                            {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                            {isCopied ? t('admin_code_copied') : t('admin_copy_code')}
                        </button>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-6 py-2 text-base font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800">
                        {t('modal_close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResetConfirmationModal: React.FC<{
    user: User;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ user, onConfirm, onCancel }) => {
    const { t } = useLocalization();

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" 
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 border border-yellow-400 dark:border-yellow-500/50 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <WarningIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">{t('admin_users_reset_password')}</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          {t('admin_reset_confirm_part1')} <strong>{user.email}</strong>?
                        </p>
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300">
                           <p className="font-bold">{t('admin_reset_confirm_warning_title')}</p>
                           <p className="text-sm">{t('admin_reset_confirm_warning_desc')}</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onCancel} className="px-6 py-2 text-base font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800">
                        {t('deleteAccount_cancel')}
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 text-base font-bold text-white bg-red-600 uppercase hover:bg-red-700">
                        {t('admin_users_reset_password')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const [users, setUsers] = useState<User[]>([]);
    const [codes, setCodes] = useState<UpgradeCode[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const botsForCodes = useMemo(() => {
        return BOTS.filter(b => b.accessTier !== 'guest' && b.id !== 'chloe-cbt');
    }, []);

    const [newCodeBotId, setNewCodeBotId] = useState(botsForCodes[0]?.id || '');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
    const [resetSuccessData, setResetSuccessData] = useState<{ email: string; newPass: string } | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);


    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [usersData, codesData, ticketsData] = await Promise.all([
                userService.getAdminUsers(),
                userService.getUpgradeCodes(),
                userService.getAdminTickets(),
            ]);
            setUsers(usersData.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
            setCodes(codesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setTickets(ticketsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err: any) {
            setError(err.message || 'Failed to load admin data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAction = async (id: string, action: () => Promise<any>) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await action();
            await loadData(); // Reload all data to ensure consistency
        } catch (err: any) {
            alert(`Action failed: ${err.message}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const confirmAndResetPassword = async () => {
        if (!userToReset) return;
        const user = userToReset;
        setUserToReset(null); // Close confirmation modal
        
        const actionId = `reset-${user.id}`;
        setActionLoading(prev => ({ ...prev, [actionId]: true }));
        try {
            const { newPassword } = await userService.resetUserPassword(user.id);
            setResetSuccessData({ email: user.email, newPass: newPassword });
        } catch (err: any) {
            alert(`Password reset failed: ${err.message}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [actionId]: false }));
        }
    };


    const handleCreateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleAction('createCode', () => userService.createUpgradeCode(newCodeBotId));
    };
    
    const handleCopyCode = (codeValue: string, codeId: string) => {
        navigator.clipboard.writeText(codeValue);
        setCopiedCodeId(codeId);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };

    const filteredUsers = useMemo(() => {
        if (!userSearchQuery) return users;
        return users.filter(user => user.email.toLowerCase().includes(userSearchQuery.toLowerCase()));
    }, [users, userSearchQuery]);
    
    const tabConfig: Record<AdminTab, { icon: React.FC<any>, key: string }> = {
        users: { icon: UsersIcon, key: 'admin_users_tab' },
        codes: { icon: KeyIcon, key: 'admin_codes_tab' },
        tickets: { icon: InboxIcon, key: 'admin_tickets_tab' },
    };

    const renderTabs = () => (
        <div className="flex border-b border-gray-300 dark:border-gray-700">
            {(['users', 'codes', 'tickets'] as AdminTab[]).map(tab => {
                const { icon: Icon, key } = tabConfig[tab];
                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase transition-colors focus:outline-none ${
                            activeTab === tab
                                ? 'border-b-2 border-green-500 text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span>{t(key)}</span>
                    </button>
                )
            })}
        </div>
    );
    
    const renderUsers = () => (
        <div className="space-y-4">
            <input 
                type="search"
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                placeholder={t('admin_search_users_placeholder')}
                className="w-full p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
             {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-3">{t('admin_users_email')}</th>
                                <th className="p-3">{t('admin_users_joined')}</th>
                                <th className="p-3">Roles</th>
                                <th className="p-3 text-center">{t('admin_users_logins')}</th>
                                <th className="p-3">{t('admin_users_last_login')}</th>
                                <th className="p-3 text-right">{t('admin_users_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{user.email}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(user.createdAt!).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            {user.isBetaTester && (
                                                <span title={t('admin_users_premium')}>
                                                    <StarIcon className="w-5 h-5 text-blue-500" />
                                                </span>
                                            )}
                                            {user.isAdmin && (
                                                <span title={t('admin_users_admin')}>
                                                    <ShieldIcon className="w-5 h-5 text-purple-500" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400 text-center">{user.loginCount || 0}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => handleAction(`toggle-premium-${user.id}`, () => userService.toggleUserPremium(user.id))} disabled={actionLoading[`toggle-premium-${user.id}`]} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50" title={t('admin_users_toggle_premium')}><StarIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleAction(`toggle-admin-${user.id}`, () => userService.toggleUserAdmin(user.id))} disabled={actionLoading[`toggle-admin-${user.id}`]} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50" title={t('admin_users_toggle_admin')}><ShieldIcon className="w-5 h-5" /></button>
                                            <button onClick={() => setUserToReset(user)} disabled={actionLoading[`reset-${user.id}`]} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50" title={t('admin_users_reset_password')}><KeyIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>{users.length > 0 ? t('admin_no_users_found') : t('admin_no_users_yet')}</p>
                </div>
            )}
        </div>
    );
    
    const renderCodes = () => (
        <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                 <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">{t('admin_codes_generate_title')}</h3>
                <form onSubmit={handleCreateCode} className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="flex-1">
                        <label htmlFor="bot-select" className="sr-only">{t('admin_codes_for_coach')}</label>
                        <select id="bot-select" value={newCodeBotId} onChange={e => setNewCodeBotId(e.target.value)} className="w-full h-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500">
                            {botsForCodes.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={actionLoading['createCode']} className="px-5 py-2 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center justify-center">
                        {actionLoading['createCode'] ? <Spinner/> : t('admin_codes_generate')}
                    </button>
                </form>
            </div>
            {codes.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-3">{t('admin_codes_code')}</th>
                                <th className="p-3">{t('admin_codes_coach')}</th>
                                <th className="p-3">{t('admin_codes_status')}</th>
                                <th className="p-3">{t('admin_codes_used_by')}</th>
                                <th className="p-3">{t('admin_codes_created')}</th>
                                <th className="p-3 text-right">{t('admin_codes_action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {codes.map(code => (
                                <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-mono text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <span>{code.code}</span>
                                        <button onClick={() => handleCopyCode(code.code, code.id)} className="p-1 text-gray-400 hover:text-green-500">
                                            {copiedCodeId === code.id ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                        </button>
                                    </td>
                                    <td className="p-3">{BOTS.find(b => b.id === code.botId)?.name || code.botId}</td>
                                    <td className="p-3">{code.isUsed 
                                        ? <span className="px-2 py-1 text-xs font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">{t('admin_codes_status_used')}</span> 
                                        : <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full">{t('admin_codes_status_available')}</span>}</td>
                                    <td className="p-3">{code.usedBy?.email || '—'}</td>
                                    <td className="p-3">{new Date(code.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleAction(`delete-code-${code.id}`, () => userService.deleteUpgradeCode(code.id))} disabled={actionLoading[`delete-code-${code.id}`]} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" title={t('admin_codes_delete')}><DeleteIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>{t('admin_no_codes_yet')}</p>
                </div>
            )}
        </div>
    );
    
    const renderTickets = () => (
        <div className="space-y-4">
            {tickets.length > 0 ? (
                 <div className="overflow-x-auto border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-3">{t('admin_tickets_details')}</th>
                                <th className="p-3">{t('admin_tickets_type')}</th>
                                <th className="p-3">{t('admin_tickets_created')}</th>
                                <th className="p-3">{t('admin_tickets_status')}</th>
                                <th className="p-3 text-right">{t('admin_tickets_action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{ticket.payload.email}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{ticket.type}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</td>
                                    <td className="p-3">
                                        {ticket.status === 'OPEN' 
                                            ? <span className="px-2 py-1 text-xs font-bold bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 rounded-full">{ticket.status}</span>
                                            : <span className="px-2 py-1 text-xs font-bold bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 rounded-full">{ticket.status}</span>
                                        }
                                    </td>
                                    <td className="p-3 text-right">
                                        {ticket.status === 'OPEN' && (
                                            <button onClick={() => handleAction(`resolve-ticket-${ticket.id}`, () => userService.resolveTicket(ticket.id))} disabled={actionLoading[`resolve-ticket-${ticket.id}`]} className="p-2 text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50" title={t('admin_tickets_resolve')}>
                                                <CheckIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4">
                    <InboxIcon className="w-12 h-12 text-gray-400" />
                    <p className="text-lg">{t('admin_tickets_no_tickets')}</p>
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>;
        if (error) return <p className="text-red-500 p-4">{error}</p>;

        const views: Record<AdminTab, React.ReactNode> = {
            users: renderUsers(),
            codes: renderCodes(),
            tickets: renderTickets(),
        };

        return <div className="p-4">{views[activeTab]}</div>;
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 sm:p-8 space-y-6 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center pb-4">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('admin_title')}</h1>
            </div>
            {renderTabs()}
            {renderContent()}
            {resetSuccessData && (
                <ResetPasswordSuccessModal
                    data={resetSuccessData}
                    onClose={() => setResetSuccessData(null)}
                />
            )}
            {userToReset && (
                <ResetConfirmationModal
                    user={userToReset}
                    onConfirm={confirmAndResetPassword}
                    onCancel={() => setUserToReset(null)}
                />
            )}
        </div>
    );
};

export default AdminView;