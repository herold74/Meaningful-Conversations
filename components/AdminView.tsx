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
import { RepeatIcon } from './icons/RepeatIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';

interface AdminViewProps {
    onBack: () => void;
    currentUser: User | null;
}

type AdminTab = 'users' | 'codes' | 'tickets' | 'feedback';
type CodeSortKeys = 'unlocks' | 'createdAt' | 'usage';

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

const AdminView: React.FC<AdminViewProps> = ({ onBack, currentUser }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<AdminTab>('tickets');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const [users, setUsers] = useState<User[]>([]);
    const [codes, setCodes] = useState<UpgradeCode[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);

    const [sortConfig, setSortConfig] = useState<{ key: CodeSortKeys; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

    const botsForCodes = useMemo(() => {
        return BOTS.filter(b => b.accessTier !== 'guest' && b.id !== 'chloe-cbt');
    }, []);

    const [newCodeBotId, setNewCodeBotId] = useState('ACCESS_PASS_1Y');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [codeEmailFilter, setCodeEmailFilter] = useState('');
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
            setCodes(codesData); // Sorting is now handled in useMemo
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

    const filteredCodes = useMemo(() => {
        const trimmedFilter = codeEmailFilter.trim().toLowerCase();
        if (!trimmedFilter) return codes;
        return codes.filter(code => 
            code.usedBy && code.usedBy.email.toLowerCase().includes(trimmedFilter)
        );
    }, [codes, codeEmailFilter]);

    const getUnlockName = useCallback((botId: string): string => {
        if (botId === 'ACCESS_PASS_1Y') return t('admin_codes_unlock_access_pass');
        if (botId === 'ACCESS_PASS_1M') return t('admin_codes_unlock_access_pass_1m');
        if (botId === 'premium') return t('admin_codes_unlock_premium');
        if (botId === 'big5') return t('admin_codes_unlock_big5');
        const bot = BOTS.find(b => b.id === botId);
        return bot?.name || botId;
    }, [t]);

    const sortedAndFilteredCodes = useMemo(() => {
        let sortableItems = [...filteredCodes];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let compare = 0;
                switch (sortConfig.key) {
                    case 'unlocks': {
                        const aValue = getUnlockName(a.botId);
                        const bValue = getUnlockName(b.botId);
                        compare = aValue.localeCompare(bValue);
                        break;
                    }
                    case 'createdAt': {
                        const aValue = new Date(a.createdAt).getTime();
                        const bValue = new Date(b.createdAt).getTime();
                        compare = aValue - bValue;
                        break;
                    }
                    case 'usage': {
                        const aValue = a.isUsed ? (a.usedBy?.email || 'Used') : 'Available';
                        const bValue = b.isUsed ? (b.usedBy?.email || 'Used') : 'Available';
                        compare = aValue.localeCompare(bValue);
                        break;
                    }
                }
                return sortConfig.direction === 'asc' ? compare : -compare;
            });
        }
        return sortableItems;
    }, [filteredCodes, sortConfig, getUnlockName]);

    const requestSort = (key: CodeSortKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const ratingsFeedback = useMemo(() => feedback.filter(f => f.rating != null), [feedback]);
    const messageReports = useMemo(() => feedback.filter(f => f.rating == null), [feedback]);

    const averageRating = useMemo(() => {
        if (ratingsFeedback.length === 0) return 0;
        const total = ratingsFeedback.reduce((sum, item) => sum + item.rating!, 0);
        return total / ratingsFeedback.length;
    }, [ratingsFeedback]);

    const filteredRatings = useMemo(() => {
        if (!selectedBotFilter) return ratingsFeedback;
        return ratingsFeedback.filter(f => f.botId === selectedBotFilter);
    }, [ratingsFeedback, selectedBotFilter]);

    const averageRatingForBot = useMemo(() => {
        if (!selectedBotFilter || filteredRatings.length === 0) return null;
        const total = filteredRatings.reduce((sum, item) => sum + item.rating!, 0);
        return (total / filteredRatings.length).toFixed(2);
    }, [filteredRatings, selectedBotFilter]);

    const allBotsWithFeedback = useMemo(() => {
        const botIds = new Set(ratingsFeedback.map(f => f.botId));
        return BOTS.filter(b => botIds.has(b.id));
    }, [ratingsFeedback]);

    const renderSortArrow = (key: CodeSortKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                return (
                    <div className="space-y-4">
                        <input type="text" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} placeholder={t('admin_search_users_placeholder')} className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{users.length === 0 ? t('admin_no_users_yet') : t('admin_no_users_found')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">{t('admin_users_email')}</th>
                                            <th className="p-3">{t('admin_users_joined')}</th>
                                            <th className="p-3">{t('admin_users_roles')}</th>
                                            <th className="p-3">{t('admin_users_logins')}</th>
                                            <th className="p-3">{t('admin_users_last_login')}</th>
                                            <th className="p-3 text-right">{t('admin_users_actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3 whitespace-nowrap break-all font-medium text-gray-800 dark:text-gray-200">{user.email}</td>
                                                <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{new Date(user.createdAt!).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.isBetaTester && <span className="px-2 py-0.5 text-xs font-bold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-full">{t('admin_users_premium')}</span>}
                                                        {user.isAdmin && <span className="px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-full">{t('admin_users_admin')}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-gray-600 dark:text-gray-400">{user.loginCount}</td>
                                                <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</td>
                                                <td className="p-3 whitespace-nowrap text-right">
                                                    <button onClick={() => handleAction(`premium-${user.id}`, () => userService.toggleUserPremium(user.id))} disabled={actionLoading[`premium-${user.id}`]} className="p-2 text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50" title={t('admin_users_toggle_premium')}><StarIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleAction(`admin-${user.id}`, () => userService.toggleUserAdmin(user.id))} disabled={actionLoading[`admin-${user.id}`] || (currentUser?.id === user.id)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" title={t('admin_users_toggle_admin')}><ShieldIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => setUserToReset(user)} disabled={actionLoading[`reset-${user.id}`]} className="p-2 text-yellow-500 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 disabled:opacity-50" title={t('admin_users_reset_password')}><KeyIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'codes':
                return (
                    <div className="space-y-4">
                        <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold md:col-span-3">{t('admin_codes_generate_title')}</h3>
                            <div className="md:col-span-2">
                                <label htmlFor="code-type" className="sr-only">{t('admin_codes_for_coach')}</label>
                                <select id="code-type" value={newCodeBotId} onChange={(e) => setNewCodeBotId(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                                    <option value="ACCESS_PASS_1Y">{t('admin_codes_unlock_access_pass')}</option>
                                    <option value="ACCESS_PASS_1M">{t('admin_codes_unlock_access_pass_1m')}</option>
                                    <option value="premium">{t('admin_codes_unlock_premium')}</option>
                                    {botsForCodes.map(bot => (
                                        <option key={bot.id} value={bot.id}>{bot.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" disabled={actionLoading['createCode']} className="px-4 py-2 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center justify-center">
                                {actionLoading['createCode'] ? <Spinner/> : t('admin_codes_generate')}
                            </button>
                        </form>
                         <input type="text" value={codeEmailFilter} onChange={(e) => setCodeEmailFilter(e.target.value)} placeholder={t('admin_codes_filter_email')} className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
                        {sortedAndFilteredCodes.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{codes.length === 0 ? t('admin_no_codes_yet') : t('admin_no_users_found')}</p>
                        ) : (
                             <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">{t('admin_codes_code')}</th>
                                            <th className="p-3">
                                                <button onClick={() => requestSort('unlocks')} className="flex items-center gap-1">{t('admin_codes_unlocks')} {renderSortArrow('unlocks')}</button>
                                            </th>
                                             <th className="p-3">
                                                <button onClick={() => requestSort('usage')} className="flex items-center gap-1">{t('admin_codes_usage')} {renderSortArrow('usage')}</button>
                                            </th>
                                            <th className="p-3">
                                                <button onClick={() => requestSort('createdAt')} className="flex items-center gap-1">{t('admin_codes_created')} {renderSortArrow('createdAt')}</button>
                                            </th>
                                            <th className="p-3 text-right">{t('admin_codes_actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                       {sortedAndFilteredCodes.map(code => (
                                            <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3 font-mono text-lg text-gray-800 dark:text-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <span>{code.code}</span>
                                                        <button onClick={() => handleCopyCode(code.code, code.id)} title={t('admin_copy_code')}>
                                                            {copiedCodeId === code.id ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4 text-gray-400 hover:text-gray-600"/>}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-gray-600 dark:text-gray-400">{getUnlockName(code.botId)}</td>
                                                <td className="p-3">
                                                    {code.isUsed ? (
                                                        <span className="px-2 py-0.5 text-xs font-bold text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 rounded-full whitespace-nowrap">
                                                            {t('admin_codes_used_by')} {code.usedBy?.email || 'N/A'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-xs font-bold text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 rounded-full">{t('admin_codes_status_available')}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(code.createdAt).toLocaleDateString()}</td>
                                                <td className="p-3 text-right">
                                                     {code.isUsed && <button onClick={() => handleAction(`revoke-${code.id}`, () => userService.revokeUpgradeCode(code.id))} disabled={actionLoading[`revoke-${code.id}`]} className="p-2 text-yellow-500 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 disabled:opacity-50" title={t('admin_codes_revoke')}><RepeatIcon className="w-5 h-5"/></button>}
                                                    <button onClick={() => handleAction(`delete-${code.id}`, () => userService.deleteUpgradeCode(code.id))} disabled={actionLoading[`delete-${code.id}`]} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" title={t('admin_codes_delete')}><DeleteIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'tickets':
                const openTickets = tickets.filter(t => t.status === 'OPEN');

                return (
                    <div className="space-y-4">
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700">
                             <h3 className="text-lg font-bold">{t('admin_support_tickets_title')}</h3>
                            {openTickets.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">{t('admin_tickets_no_tickets')}</p>
                            ) : (
                                <div className="overflow-x-auto mt-2">
                                    <table className="min-w-full text-sm">
                                        <thead className="text-left font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            <tr>
                                                <th className="p-3">{t('admin_tickets_details')}</th>
                                                <th className="p-3">{t('admin_tickets_type')}</th>
                                                <th className="p-3">{t('admin_tickets_created')}</th>
                                                <th className="p-3">{t('admin_tickets_status')}</th>
                                                <th className="p-3 text-right">{t('admin_tickets_actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {openTickets.map(ticket => (
                                                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{ticket.payload.email}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-400">{ticket.type}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</td>
                                                    <td className="p-3"><span className="px-2 py-0.5 text-xs font-bold text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 rounded-full">{ticket.status}</span></td>
                                                    <td className="p-3 text-right">
                                                         <button onClick={() => handleAction(`resolve-${ticket.id}`, () => userService.resolveTicket(ticket.id))} disabled={actionLoading[`resolve-${ticket.id}`]} className="p-2 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50" title={t('admin_tickets_resolve')}><CheckIcon className="w-5 h-5"/></button>
                                                         <button onClick={() => handleAction(`delete-ticket-${ticket.id}`, () => userService.deleteTicket(ticket.id))} disabled={actionLoading[`delete-ticket-${ticket.id}`]} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" title={t('admin_codes_delete')}><DeleteIcon className="w-5 h-5"/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700">
                            <h3 className="text-lg font-bold">{t('admin_message_reports_title')}</h3>
                             {messageReports.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">{t('admin_no_message_reports')}</p>
                            ) : (
                                <div className="overflow-x-auto mt-2">
                                    <table className="min-w-full text-sm">
                                        <thead className="text-left font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            <tr>
                                                <th className="p-3 w-1/3">{t('admin_feedback_comments')}</th>
                                                <th className="p-3">{t('admin_feedback_bot')}</th>
                                                <th className="p-3">{t('admin_feedback_user')}</th>
                                                <th className="p-3">{t('admin_feedback_submitted')}</th>
                                                <th className="p-3 text-right">{t('admin_codes_actions')}</th>
                                            </tr>
                                        </thead>
                                         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {messageReports.map(item => <MessageReportTableRow key={item.id} item={item} />)}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'feedback':
                 return (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-2">{t('admin_ratings_overall_avg')}</h3>
                            {ratingsFeedback.length > 0 ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-800 dark:text-gray-200">{averageRating.toFixed(2)}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{t('admin_ratings_total_ratings', { count: ratingsFeedback.length })}</span>
                                </div>
                            ) : (
                                <p className="text-gray-500">{t('admin_ratings_no_ratings')}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <select value={selectedBotFilter || ''} onChange={(e) => setSelectedBotFilter(e.target.value)} className="p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                                <option value="">All Coaches</option>
                                {allBotsWithFeedback.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                            </select>
                            {selectedBotFilter && (
                                <>
                                    <span className="font-bold">{t('admin_ratings_avg_rating')}: {averageRatingForBot}</span>
                                    <button onClick={() => setSelectedBotFilter(null)} className="text-sm text-red-500 hover:underline">{t('admin_ratings_clear_filter')}</button>
                                </>
                            )}
                        </div>
                        {filteredRatings.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{t('admin_feedback_no_feedback')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">{t('admin_feedback_rating')}</th>
                                            <th className="p-3 w-1/2">{t('admin_feedback_comments')}</th>
                                            <th className="p-3">{t('admin_feedback_bot')}</th>
                                            <th className="p-3">{t('admin_feedback_user')}</th>
                                            <th className="p-3">{t('admin_feedback_submitted')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredRatings.map(item => <FeedbackTableRow key={item.id} item={item} />)}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
        }
    };
    
    const TabButton: React.FC<{ tabId: AdminTab; icon: React.FC<any>; label: string }> = ({ tabId, icon: Icon, label }) => {
        const isActive = activeTab === tabId;
        return (
            <button
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 flex flex-col items-center justify-center p-3 text-center transition-colors border-b-4 ${isActive ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                role="tab"
                aria-selected={isActive}
            >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold uppercase" dangerouslySetInnerHTML={{ __html: label }} />
            </button>
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('admin_title')}</h1>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center py-20"><Spinner /></div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="space-y-6">
                    <div className="flex border-b border-gray-200 dark:border-gray-700" role="tablist">
                        <TabButton tabId="users" icon={UsersIcon} label={t('admin_users_tab')} />
                        <TabButton tabId="codes" icon={KeyIcon} label={t('admin_codes_tab')} />
                        <TabButton tabId="tickets" icon={InboxIcon} label={t('admin_tickets_tab')} />
                        <TabButton tabId="feedback" icon={StarIcon} label={t('admin_ratings_tab')} />
                    </div>
                    <div role="tabpanel">
                        {renderTabContent()}
                    </div>
                </div>
            )}
            {resetSuccessData && <ResetPasswordSuccessModal data={resetSuccessData} onClose={() => setResetSuccessData(null)} />}
            {userToReset && <ResetConfirmationModal user={userToReset} onConfirm={confirmAndResetPassword} onCancel={() => setUserToReset(null)} />}
        </div>
    );
};

export default AdminView;