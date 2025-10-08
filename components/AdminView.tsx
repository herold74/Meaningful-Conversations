import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as userService from '../services/userService';
import { User, UpgradeCode, Ticket, Feedback } from '../types';
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
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface AdminViewProps {
    onBack: () => void;
}

type AdminTab = 'users' | 'codes' | 'tickets' | 'feedback';

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

const FeedbackTableRow: React.FC<{ item: Feedback }> = ({ item }) => {
    const { t } = useLocalization();
    const [isCommentExpanded, setIsCommentExpanded] = useState(false);
    const bot = BOTS.find(b => b.id === item.botId);

    const COMMENT_TRUNCATE_LENGTH = 50;
    const hasComment = item.comments && item.comments.trim().length > 0;
    const isLongComment = hasComment && item.comments.length > COMMENT_TRUNCATE_LENGTH;


    return (
        <>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3 align-top">
                    {item.rating != null && (
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                                <StarIcon key={star} className={`w-4 h-4 ${star <= item.rating! ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill={star <= item.rating! ? 'currentColor' : 'none'} />
                            ))}
                        </div>
                    )}
                </td>
                <td className="p-3 align-top whitespace-normal break-words text-gray-800 dark:text-gray-200">
                     {isLongComment ? (
                        <button onClick={() => setIsCommentExpanded(p => !p)} className="flex items-start gap-2 text-left text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                            <ChatBubbleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="italic">
                                {item.comments.substring(0, COMMENT_TRUNCATE_LENGTH)}...
                            </span>
                        </button>
                    ) : (
                        hasComment ? <p>{item.comments}</p> : <span className="italic text-gray-400 dark:text-gray-500">No comment provided.</span>
                    )}
                </td>
                <td className="p-3 align-top whitespace-normal break-words text-gray-600 dark:text-gray-400">{bot?.name || item.botId}</td>
                <td className="p-3 align-top whitespace-normal break-all text-gray-600 dark:text-gray-400">{item.isAnonymous ? <span className="italic">{t('admin_feedback_anonymous')}</span> : item.user?.email}</td>
                <td className="p-3 align-top text-gray-600 dark:text-gray-400">{new Date(item.createdAt).toLocaleString()}</td>
            </tr>
            {isCommentExpanded && (
                <tr className="bg-gray-50 dark:bg-gray-900/30 animate-fadeIn">
                    <td colSpan={5} className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-1">Full Comment</h5>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{item.comments}</p>
                    </td>
                </tr>
            )}
        </>
    );
};

const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<AdminTab>('tickets');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const [users, setUsers] = useState<User[]>([]);
    const [codes, setCodes] = useState<UpgradeCode[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);

    const botsForCodes = useMemo(() => {
        return BOTS.filter(b => b.accessTier !== 'guest' && b.id !== 'chloe-cbt');
    }, []);

    const [newCodeBotId, setNewCodeBotId] = useState('premium');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
    const [resetSuccessData, setResetSuccessData] = useState<{ email: string; newPass: string } | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [selectedBotFilter, setSelectedBotFilter] = useState<string | null>(null);


    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [usersData, codesData, ticketsData, feedbackData] = await Promise.all([
                userService.getAdminUsers(),
                userService.getUpgradeCodes(),
                userService.getAdminTickets(),
                userService.getAdminFeedback(),
            ]);
            setUsers(usersData.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
            setCodes(codesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setTickets(ticketsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setFeedback(feedbackData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

    const MessageReportTableRow: React.FC<{ item: Feedback }> = ({ item }) => {
        const bot = BOTS.find(b => b.id === item.botId);
        const [isExpanded, setIsExpanded] = useState(false);
    
        return (
            <>
                <tr 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => setIsExpanded(p => !p)}
                >
                    <td className="p-3 align-top whitespace-normal break-words text-gray-800 dark:text-gray-200">
                        {item.comments ? <p>{item.comments}</p> : <span className="italic text-gray-400 dark:text-gray-500">No comment provided.</span>}
                    </td>
                    <td className="p-3 align-top whitespace-normal break-words text-gray-600 dark:text-gray-400">{bot?.name || item.botId}</td>
                    <td className="p-3 align-top whitespace-normal break-all text-gray-600 dark:text-gray-400">{item.isAnonymous ? <span className="italic">{t('admin_feedback_anonymous')}</span> : item.user?.email}</td>
                    <td className="p-3 align-top text-gray-600 dark:text-gray-400">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="p-3 align-top text-right">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction(`delete-report-${item.id}`, () => userService.deleteMessageReport(item.id));
                            }}
                            disabled={actionLoading[`delete-report-${item.id}`]}
                            className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" 
                            title={t('admin_codes_delete')}
                        >
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </td>
                </tr>
                {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-900/30 animate-fadeIn">
                        <td colSpan={5} className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-1">{t('admin_feedback_user_prompt')}</h5>
                                    <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {item.lastUserMessage || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-1">{t('admin_feedback_bot_response')}</h5>
                                    <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {item.botResponse || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </>
        );
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
    
    const getUnlockName = useCallback((botId: string): string => {
        if (botId === 'premium') return t('admin_codes_unlock_premium');
        if (botId === 'big5') return t('admin_codes_unlock_big5');
        const bot = BOTS.find(b => b.id === botId);
        return bot?.name || botId;
    }, [t]);

    const tabConfig: Record<AdminTab, { icon: React.FC<any>, key: string }> = {
        users: { icon: UsersIcon, key: 'admin_users_tab' },
        codes: { icon: KeyIcon, key: 'admin_codes_tab' },
        tickets: { icon: InboxIcon, key: 'admin_tickets_tab' },
        feedback: { icon: StarIcon, key: 'admin_ratings_tab' },
    };

    const sessionFeedback = useMemo(() => feedback.filter(item => item.rating !== null), [feedback]);
    const messageReports = useMemo(() => feedback.filter(item => item.rating === null), [feedback]);

    const renderTabs = () => (
        <div className="flex border-b border-gray-300 dark:border-gray-700">
            {(['users', 'feedback', 'tickets', 'codes'] as AdminTab[]).map(tab => {
                const { icon: Icon, key } = tabConfig[tab];
                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 text-sm font-bold uppercase transition-colors focus:outline-none ${
                            activeTab === tab
                                ? 'border-b-2 border-green-500 text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        aria-label={t(key)}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="hidden md:inline">{t(key)}</span>
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
                    <table className="w-full text-left text-sm">
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
                                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200 break-words">{user.email}</td>
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
                                    <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
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
                        <select id="bot-select" value={newCodeBotId} onChange={e => setNewCodeBotId(e.target.value)} className="w-full h-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500">
                            <option value="premium">{t('admin_codes_unlock_premium')}</option>
                            <option value="big5">{t('admin_codes_unlock_big5')}</option>
                            <option disabled>---</option>
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
                    <table className="w-full text-left text-sm">
                         <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-3">{t('admin_codes_code')}</th>
                                <th className="p-3">{t('admin_codes_unlocks')}</th>
                                <th className="p-3">{t('admin_codes_created')}</th>
                                <th className="p-3">{t('admin_codes_usage')}</th>
                                <th className="p-3 text-right">{t('admin_codes_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {codes.map(code => (
                                <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-mono text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center">
                                            <span className="whitespace-nowrap">{code.code}</span>
                                            <button onClick={() => handleCopyCode(code.code, code.id)} className="ml-2 p-1 inline-flex align-middle text-gray-400 hover:text-green-500 flex-shrink-0">
                                                {copiedCodeId === code.id ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{getUnlockName(code.botId)}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(code.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 break-all text-gray-600 dark:text-gray-400">
                                        {code.isUsed 
                                            ? (code.usedBy?.email || <span className="px-2 py-1 text-xs font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">{t('admin_codes_status_used')}</span>) 
                                            : <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full">{t('admin_codes_status_available')}</span>}
                                    </td>
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
        <div className="space-y-8">
            <div>
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">{t('admin_support_tickets_title')}</h3>
                {tickets.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="p-3">{t('admin_tickets_details')}</th>
                                    <th className="p-3">{t('admin_tickets_type')}</th>
                                    <th className="p-3">{t('admin_tickets_created')}</th>
                                    <th className="p-3">{t('admin_tickets_status')}</th>
                                    <th className="p-3 text-right">{t('admin_tickets_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200 break-all">{ticket.payload.email}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{ticket.type}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleString()}</td>
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
                                            {ticket.status === 'RESOLVED' && (
                                                <button 
                                                    onClick={() => handleAction(`delete-ticket-${ticket.id}`, () => userService.deleteTicket(ticket.id))} 
                                                    disabled={actionLoading[`delete-ticket-${ticket.id}`]}
                                                    className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" 
                                                    title={t('admin_codes_delete')}
                                                >
                                                    <DeleteIcon className="w-5 h-5" />
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

            <div>
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">{t('admin_message_reports_title')}</h3>
                {messageReports.length > 0 ? (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400 sticky top-0">
                                <tr>
                                    <th className="p-3">{t('admin_feedback_comments')}</th>
                                    <th className="p-3 w-24">{t('admin_feedback_bot')}</th>
                                    <th className="p-3 w-48">{t('admin_feedback_user')}</th>
                                    <th className="p-3 w-44">{t('admin_feedback_submitted')}</th>
                                    <th className="p-3 w-20 text-right">{t('admin_tickets_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {messageReports.map(item => <MessageReportTableRow key={item.id} item={item} />)}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4">
                        <ChatBubbleIcon className="w-12 h-12 text-gray-400" />
                        <p className="text-lg">{t('admin_no_message_reports')}</p>
                    </div>
                )}
            </div>
        </div>
    );
    
    const ratingStats = useMemo(() => {
        const statsByBot = BOTS.reduce((acc, bot) => {
            acc[bot.id] = {
                id: bot.id,
                name: bot.name,
                avatar: bot.avatar,
                ratings: [] as number[],
                count: 0,
                distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            };
            return acc;
        }, {} as Record<string, { id: string; name: string; avatar: string; ratings: number[]; count: number; distribution: Record<string, number> }>);

        let totalRatings = 0;
        let totalSum = 0;

        sessionFeedback.forEach(item => {
            if (item.rating && item.rating >= 1 && item.rating <= 5 && statsByBot[item.botId]) {
                const ratingKey = String(item.rating);
                statsByBot[item.botId].ratings.push(item.rating);
                statsByBot[item.botId].count++;
                statsByBot[item.botId].distribution[ratingKey]++;
                totalRatings++;
                totalSum += item.rating;
            }
        });

        const overallAverage = totalRatings > 0 ? (totalSum / totalRatings).toFixed(2) : 'N/A';

        const botStats = Object.values(statsByBot).map(botStat => {
            const sum = botStat.ratings.reduce((a, b) => a + b, 0);
            const average = botStat.count > 0 ? (sum / botStat.count).toFixed(2) : 'N/A';
            return { ...botStat, average };
        }).sort((a,b) => b.count - a.count);

        return { botStats, overallAverage, totalRatings };
    }, [sessionFeedback]);
    
    const filteredFeedback = useMemo(() => {
        if (!selectedBotFilter) return sessionFeedback;
        return sessionFeedback.filter(item => item.botId === selectedBotFilter);
    }, [sessionFeedback, selectedBotFilter]);

    const renderRatings = () => (
        <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('admin_ratings_overall_avg')}</h3>
                <p className="text-4xl font-bold text-green-500 dark:text-green-400">{ratingStats.overallAverage}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_ratings_total_ratings', { count: ratingStats.totalRatings })}</p>
            </div>
            {ratingStats.totalRatings > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ratingStats.botStats.map(stat => (
                            <div key={stat.id} onClick={() => setSelectedBotFilter(stat.id)} className={`p-4 bg-white dark:bg-gray-800/50 border-2  transition-all duration-200 cursor-pointer hover:border-green-500 dark:hover:border-green-400 ${selectedBotFilter === stat.id ? 'border-green-500' : 'border-gray-200 dark:border-gray-700/50'}`}>
                                <div className="flex items-center gap-4 mb-3">
                                    <img src={stat.avatar} alt={stat.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{stat.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_ratings_avg_rating')}: <span className="font-bold text-gray-700 dark:text-gray-300">{stat.average}</span> ({stat.count})</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {([5, 4, 3, 2, 1]).map(star => {
                                        const count = stat.distribution[String(star)];
                                        const percentage = stat.count > 0 ? (count / stat.count) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-2 text-xs">
                                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">{star} <StarIcon className="w-3 h-3 text-yellow-400"/></span>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 flex-1">
                                                    <div className="bg-green-400 h-4 text-center text-black font-bold" style={{ width: `${percentage}%` }}>
                                                        {count > 0 ? count : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{selectedBotFilter ? `Details for ${ratingStats.botStats.find(b => b.id === selectedBotFilter)?.name}` : 'All Feedback'}</h3>
                            {selectedBotFilter && (
                                <button onClick={() => setSelectedBotFilter(null)} className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline">{t('admin_ratings_clear_filter')}</button>
                            )}
                        </div>
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="p-3 w-28">{t('admin_feedback_rating')}</th>
                                        <th className="p-3">{t('admin_feedback_comments')}</th>
                                        <th className="p-3 w-24">{t('admin_feedback_bot')}</th>
                                        <th className="p-3 w-48">{t('admin_feedback_user')}</th>
                                        <th className="p-3 w-44">{t('admin_feedback_submitted')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredFeedback.map(item => <FeedbackTableRow key={item.id} item={item} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4">
                    <StarIcon className="w-12 h-12 text-gray-400" />
                    <p className="text-lg">{t('admin_ratings_no_ratings')}</p>
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
            feedback: renderRatings(),
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