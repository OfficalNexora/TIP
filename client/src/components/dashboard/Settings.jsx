import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { supabase } from '../../supabase';
import Icons from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionModal from './SubscriptionModal';
import BillingPage from './billing/BillingPage';

// --- Configuration ---
const SECTIONS = [
    { id: 'profile', label: 'Profile', icon: Icons.User },
    { id: 'security', label: 'Security', icon: Icons.Lock },
    { id: 'billing', label: 'Subscription & Billing', icon: Icons.CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Icons.Settings },
    { id: 'privacy', label: 'Privacy & Data', icon: Icons.Shield },
    { id: 'integrations', label: 'Integrations', icon: Icons.Grid },
];

// --- Sub-Components ---

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-colors">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">{subtitle}</p>}
    </div>
);

const FieldGroup = ({ label, children }) => (
    <div className="mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 transition-colors">{label}</label>
        {children}
    </div>
);

const InputField = ({ type = "text", defaultValue, readOnly }) => (
    <input
        type={type}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[4px] px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
    />
);

const Divider = () => <div className="h-px bg-slate-100 dark:bg-slate-800 my-8 w-full transition-colors" />;

// --- Content Sections ---

const UpdateNameModal = ({ isOpen, onClose, currentFirstName, currentLastName, onUpdate }) => {
    const [firstName, setFirstName] = useState(currentFirstName);
    const [lastName, setLastName] = useState(currentLastName);

    useEffect(() => {
        if (isOpen) {
            setFirstName(currentFirstName);
            setLastName(currentLastName);
        }
    }, [isOpen, currentFirstName, currentLastName]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden transform transition-all scale-100 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-tip-text-main transition-colors">Palitan ang pangalan</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
                        <Icons.X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5 bg-white dark:bg-slate-900 transition-colors">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Pangalan</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 dark:focus:ring-emerald-500 transition-all font-sans"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Apelyido</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 dark:focus:ring-emerald-500 transition-all font-sans"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                    >
                        Kanselahin
                    </button>
                    <button
                        onClick={() => {
                            onUpdate(firstName, lastName);
                            onClose();
                        }}
                        className="px-5 py-2 text-sm font-bold text-white bg-[#007ba0] hover:bg-[#00607d] rounded-md shadow-sm hover:shadow transition-all"
                    >
                        I-update
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 bg-slate-800 dark:bg-slate-950 text-white text-xs rounded-md shadow-xl z-50 animate-fade-in ring-1 ring-white/10">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-800 dark:bg-slate-950 rotate-45"></div>
                    {content}
                </div>
            )}
        </div>
    );
};

const UpdateGenericModal = ({ isOpen, onClose, title, label, initialValue, onUpdate, type = "text" }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden transform transition-all scale-100 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-tip-text-main transition-colors">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
                        <Icons.X size={18} />
                    </button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 transition-colors">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">{label}</label>
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 dark:focus:ring-emerald-500 transition-all font-sans"
                    />
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onUpdate(value);
                            onClose();
                        }}
                        className="px-5 py-2 text-sm font-bold text-white bg-[#007ba0] hover:bg-[#00607d] rounded-md shadow-sm hover:shadow transition-all"
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const UpdateEmailModal = ({ isOpen, onClose }) => {
    const { session } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentEmail = session?.user?.email || '';
    const isSocialUser = session?.user?.app_metadata?.provider !== 'email';

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setError(null);
        }
    }, [isOpen]);

    const handleUpdate = async () => {
        if (!email) {
            setError('Please provide a new email address.');
            return;
        }

        if (!isSocialUser && !password) {
            setError('Current password is required to verify your identity.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. For standard users, verify password first
            if (!isSocialUser) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: currentEmail,
                    password: password
                });
                if (signInError) throw new Error('Incorrect password. Please verify your credentials.');
            }

            // 2. Update email (Supabase v2: attributes first, options second)
            const { error: updateError } = await supabase.auth.updateUser(
                { email: email },
                { emailRedirectTo: `${window.location.origin}/?type=email_change` }
            );
            if (updateError) throw updateError;

            alert('Confirmation links have been sent to ' + currentEmail + ' and ' + email + '. Both must be clicked to complete the change.');
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to initiate email change.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-slate-200 dark:border-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-tip-text-main">Bagong Email Address</h3>
                    <button onClick={onClose}><Icons.X size={16} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" /></button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bagong Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="name@example.com"
                        />
                    </div>

                    {!isSocialUser ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kasalukuyang Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder="Required for security"
                            />
                            <p className="text-[10px] text-slate-400 mt-1.5 align-middle">
                                Magpapadala kami ng confirmation link sa bago at lumang email.
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded">
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 italic">
                                Note: Since you are using {session?.user?.app_metadata?.provider} login, identity verification is handled by your provider.
                            </p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Icons.Loader className="animate-spin" size={16} /> : 'I-update ang Email'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ProfileContent = ({ userProfile, handleUpdateProfile }) => {
    const { session } = useAuth();
    // State for modals
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'email', 'recovery', 'org', 'role', 'desc' or null
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [localAvatarUrl, setLocalAvatarUrl] = useState(userProfile.avatarUrl);

    // Preferences State (Local for now, normally would be in userProfile)
    const [preferences, setPreferences] = useState({
        displayName: userProfile.firstName,
        locale: 'en-US',
        timezone: 'Asia/Manila',
        dateFormat: 'MM/DD/YYYY'
    });

    const [sessionData, setSessionData] = useState({
        id: 'loading...',
        provider: 'Supabase',
        created_at: new Date().toISOString()
    });

    useEffect(() => {
        setLocalAvatarUrl(userProfile.avatarUrl);
    }, [userProfile.avatarUrl]);

    useEffect(() => {
        const getSessionInfo = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSessionData({
                    id: session.user.id,
                    provider: session.user.app_metadata.provider || 'Supabase',
                    created_at: session.user.created_at
                });
            }
        };
        getSessionInfo();
    }, []);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/user/avatar`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.avatarUrl) {
                const newUrl = `${response.data.avatarUrl}?t=${Date.now()}`;
                setLocalAvatarUrl(newUrl);
                handleUpdateProfile('avatarUrl', newUrl);
            }
        } catch (error) {
            console.error('Avatar upload failed:', error);
            alert(error.response?.data?.error || 'Failed to upload avatar');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handlePreferenceUpdate = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        // In real app: api.patch('/profile/preferences', {[key]: value })
        // console.log('Updated preference:', key, value);
    };

    return (
        <div className="animate-fade-in max-w-3xl space-y-12">
            <SectionHeader title="Profile" subtitle="I-manage ang iyong personal na impormasyon at account." />

            {/* 1. IDENTITY INFORMATION (Supabase Managed) */}
            <section className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Identity Information</h3>

                <div className="flex items-start gap-8">
                    {/* Avatar */}
                    <div className="group relative">
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-sm relative">
                            {avatarUploading ? (
                                <Icons.Loader className="animate-spin text-slate-400" size={32} />
                            ) : localAvatarUrl ? (
                                <img src={localAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">
                                    {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                                </span>
                            )}

                            {/* Upload Overlay */}
                            {!avatarUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Icons.Camera className="text-white" size={24} />
                                </div>
                            )}
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={avatarUploading}
                            />
                        </div>
                        <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {avatarUploading ? 'Uploading...' : 'Palitan ang Litrato'}
                        </button>
                    </div>

                    <div className="flex-1 space-y-5">
                        <FieldGroup label="Buong Pangalan">
                            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
                                <span className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {userProfile.firstName} {userProfile.lastName}
                                </span>
                                <button
                                    onClick={() => setIsNameModalOpen(true)}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                    I-update
                                </button>
                            </div>
                        </FieldGroup>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FieldGroup label="Email Address">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{userProfile.email}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setActiveModal('email')}
                                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-opacity"
                                        >
                                            I-update
                                        </button>
                                    </div>
                                </div>
                            </FieldGroup>

                            <FieldGroup label="Account ID">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded border border-slate-100 dark:border-slate-800">
                                    <span className="text-xs text-slate-500 dark:text-slate-500 font-mono truncate max-w-[140px]" title={sessionData.id}>{sessionData.id}</span>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                        <Icons.Lock size={10} />
                                        Supabase
                                    </div>
                                </div>
                            </FieldGroup>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. ORGANIZATION & ROLE (User Editable) */}
            <section className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Organization & Role</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FieldGroup label="Organisasyon / Ahensya">
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
                            <span className="text-base text-slate-800 dark:text-slate-200">{userProfile.organization}</span>
                            <button
                                onClick={() => setActiveModal('org')}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                I-update
                            </button>
                        </div>
                    </FieldGroup>

                    <FieldGroup label="Role / Titulo">
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
                            <span className="text-base text-slate-800 dark:text-slate-200">{userProfile.role}</span>
                            <button
                                onClick={() => setActiveModal('role')}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                I-update
                            </button>
                        </div>
                    </FieldGroup>
                </div>

                <FieldGroup label="Deskripsyon ng Role (Optional)">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-base text-slate-500 dark:text-slate-400 italic">
                            {userProfile.roleDescription || "No description set"}
                        </span>
                        <button
                            onClick={() => setActiveModal('desc')}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            I-update
                        </button>
                    </div>
                </FieldGroup>
            </section>

            {/* 3. PREFERENCES */}
            <section className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Preferences</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldGroup label="Display Name">
                        <input
                            type="text"
                            value={preferences.displayName}
                            onChange={(e) => handlePreferenceUpdate('displayName', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                        />
                    </FieldGroup>

                    <FieldGroup label="Lengguwahe">
                        <div className="relative group/tooltip">
                            <select
                                disabled
                                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70 appearance-none"
                            >
                                <option value="en-US">English (United States)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    Coming Soon
                                </span>
                            </div>
                        </div>
                    </FieldGroup>

                    <FieldGroup label="Timezone">
                        <select
                            value={preferences.timezone}
                            onChange={(e) => handlePreferenceUpdate('timezone', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="Asia/Manila">Asia/Manila (UTC+08:00)</option>
                            <option value="UTC">UTC (UTC+00:00)</option>
                            <option value="America/New_York">Eastern Time (UTC-05:00)</option>
                        </select>
                    </FieldGroup>

                    <FieldGroup label="Format ng Petsa">
                        <select
                            value={preferences.dateFormat}
                            onChange={(e) => handlePreferenceUpdate('dateFormat', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                        </select>
                    </FieldGroup>
                </div>
            </section>

            {/* 4. AUDIT METADATA */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Detalye ng Account</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Ginawa ang Account</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(sessionData.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Huling Update</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Status ng Account</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active</span>
                    </div>
                </div>
            </div>


            {/* Modals */}
            <UpdateNameModal
                isOpen={isNameModalOpen}
                onClose={() => setIsNameModalOpen(false)}
                currentFirstName={userProfile.firstName}
                currentLastName={userProfile.lastName}
                onUpdate={(newFirst, newLast) => {
                    handleUpdateProfile('firstName', newFirst);
                    handleUpdateProfile('lastName', newLast);
                }}
            />

            <UpdateGenericModal
                isOpen={activeModal === 'org'}
                onClose={() => setActiveModal(null)}
                title="Update Organization"
                label="Organization / Agency"
                initialValue={userProfile.organization}
                onUpdate={(val) => handleUpdateProfile('organization', val)}
            />

            <UpdateGenericModal
                isOpen={activeModal === 'role'}
                onClose={() => setActiveModal(null)}
                title="Update Role"
                label="Role / Title"
                initialValue={userProfile.role}
                onUpdate={(val) => handleUpdateProfile('role', val)}
            />

            <UpdateGenericModal
                isOpen={activeModal === 'desc'}
                onClose={() => setActiveModal(null)}
                title="Update Role Description"
                label="Description"
                initialValue={userProfile.roleDescription || ""}
                onUpdate={(val) => handleUpdateProfile('roleDescription', val)}
                type="text"
            />

            <UpdateEmailModal
                isOpen={activeModal === 'email'}
                onClose={() => setActiveModal(null)}
            />
        </div>
    );
};

const BackupCodesModal = ({ isOpen, onClose }) => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState('CHECKING'); // CHECKING, EMPTY, SHOW, REGENERATE_PROMPT
    const [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/security/setup`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (response.data.has_backup_codes && codes.length === 0) {
                // Codes exist but we don't have them in memory (security best practice: don't store plain codes).
                // Show "Regenerate" prompt.
                setViewState('REGENERATE_PROMPT');
            } else if (codes.length > 0) {
                setViewState('SHOW');
            } else {
                setViewState('EMPTY');
            }
        } catch (error) {
            console.error('Failed to check status', error);
            setViewState('EMPTY'); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const hashCode = async (code) => {
        const msgUint8 = new TextEncoder().encode(code);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // 1. Generate local codes
            const newCodes = Array.from({ length: 8 }, () => {
                const part1 = Math.floor(1000 + Math.random() * 9000);
                const part2 = Math.floor(1000 + Math.random() * 9000);
                return `${part1}-${part2}`;
            });

            // 2. Hash codes locally (Zero-Knowledge)
            const hashes = await Promise.all(newCodes.map(c => hashCode(c)));

            // 3. Send only hashes to server
            const { data: { session } } = await supabase.auth.getSession();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/security/backup-codes/save`, { hashes }, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            setCodes(newCodes);
            setViewState('SHOW');
            setDownloaded(false);
        } catch (error) {
            console.error('Failed to generate/save codes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([codes.join("\n")], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "unesco-ai-mirror-recovery-codes.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        setDownloaded(true);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-slate-200 dark:border-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-tip-text-main">Backup Codes</h3>
                    <button onClick={onClose}><Icons.X size={16} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" /></button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900">
                    {/* LOADING STATE */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                            <Icons.Loader className="animate-spin mb-3 text-blue-600" size={24} />
                            <span className="text-xs font-medium">Verifying security status...</span>
                        </div>
                    )}

                    {/* EMPTY STATE - First Time */}
                    {!loading && viewState === 'EMPTY' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                                <Icons.Lock size={32} />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Gumawa ng Backup Codes</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                                Wala ka pang backup codes. Ito lang ang paraan para mabawi ang account mo kung mawala ang access mo.
                            </p>
                            <button
                                onClick={handleGenerate}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <Icons.Shield size={16} /> Gumawa ng Codes
                            </button>
                        </div>
                    )}

                    {/* REGENERATE PROMPT - Codes exist but hidden */}
                    {!loading && viewState === 'REGENERATE_PROMPT' && (
                        <div className="text-center">
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg p-4 mb-6 text-left flex gap-3">
                                <Icons.AlertCircle size={20} className="text-amber-600 dark:text-amber-500 shrink-0" />
                                <div className="text-xs text-amber-900 dark:text-amber-200/80">
                                    <strong className="block font-bold mb-1">Active na ang Codes</strong>
                                    You have defined backup codes, but for security we cannot show them again. Generating new codes will invalidate the old ones.
                                </div>
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="w-full py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm transition-all hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center gap-2"
                            >
                                <Icons.RefreshCw size={16} /> Palitan at Gumawa ng Bago
                            </button>
                        </div>
                    )}

                    {/* SHOW CODES */}
                    {!loading && viewState === 'SHOW' && (
                        <>
                            <div className="flex items-start gap-4 mb-6 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30 animate-fade-in-up">
                                <Icons.CheckCircle size={18} className="text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
                                <div className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200/80">
                                    <strong className="block font-bold mb-1 text-emerald-700 dark:text-emerald-400">Codes Generated</strong>
                                    Save these codes immediately. We cannot show them to you again once you close this window.
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {codes.map(code => (
                                    <div key={code} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-2 text-center font-mono text-xs font-bold tracking-widest text-slate-600 dark:text-slate-400 select-all hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-default">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <Icons.Download size={14} /> Download
                                    </button>
                                    <button onClick={handleGenerate} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <Icons.RefreshCw size={14} /> Regenerate
                                    </button>
                                </div>
                                <button onClick={onClose} className="w-full py-2 text-xs font-bold text-white bg-slate-900 dark:bg-blue-600 rounded-md hover:opacity-90 transition-opacity">
                                    I have saved these codes
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const SecurityContent = ({ userProfile, onOpenBackupCodes }) => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [isPasswordPromptOpen, setPasswordPromptOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const fetchPublicIP = async () => {
        try {
            const res = await axios.get('https://api64.ipify.org?format=json');
            return res.data.ip;
        } catch (e) {
            return null;
        }
    };

    const fetchData = async () => {
        setLoadingSessions(true);
        try {
            const publicIp = await fetchPublicIP();
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const authHeader = {
                Authorization: `Bearer ${authSession?.access_token}`,
                'x-public-ip': publicIp
            };

            const [logsRes, sessionsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/security/audit-logs`, { headers: authHeader }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/security/sessions`, { headers: authHeader })
            ]);

            setAuditLogs(logsRes.data);
            setSessions(sessionsRes.data);
        } catch (error) {
            console.error('Failed to fetch security data', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogoutOthers = async () => {
        if (!confirm('This will sign out all other active sessions. Proceed?')) return;

        try {
            const publicIp = await fetchPublicIP();
            const { data: { session: authSession } } = await supabase.auth.getSession();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/security/sessions/revoke`, {}, {
                headers: {
                    Authorization: `Bearer ${authSession?.access_token}`,
                    'x-public-ip': publicIp
                }
            });

            // Re-fetch sessions to show only current one
            await fetchData();
            alert('Successfully signed out of other devices.');
        } catch (error) {
            console.error('Logout failed', error);
            alert('Failed to revoke sessions: ' + (error.response?.data?.details || error.message));
        }
    };

    const handleSignOutAll = async () => {
        if (!confirm('This will sign out ALL devices including this one. Proceed?')) return;

        try {
            const publicIp = await fetchPublicIP();
            const { data: { session: authSession } } = await supabase.auth.getSession();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/security/sessions/revoke-all`, {}, {
                headers: {
                    Authorization: `Bearer ${authSession?.access_token}`,
                    'x-public-ip': publicIp
                }
            });

            // Sign out locally
            await supabase.auth.signOut();
            window.location.reload();
        } catch (error) {
            console.error('Sign out all failed', error);
            alert('Failed to sign out all devices: ' + (error.response?.data?.details || error.message));
        }
    };

    const handleRevokeSession = async (sessionId) => {
        if (!confirm('Are you sure you want to revoke this session?')) return;
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/security/sessions/revoke/${sessionId}`, {}, {
                headers: { Authorization: `Bearer ${authSession?.access_token}` }
            });
            fetchData(); // Refresh sessions after revoking
        } catch (error) {
            console.error('Failed to revoke session', error);
            alert('Failed to revoke session. Please try again.');
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('Clear login history? This cannot be undone.')) return;
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/security/audit-logs`, {
                headers: { Authorization: `Bearer ${authSession?.access_token}` }
            });
            setAuditLogs([]);
        } catch (error) {
            console.error('Failed to clear logs', error);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }

        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/security/password`,
                { newPassword },
                { headers: { Authorization: `Bearer ${authSession?.access_token}` } }
            );
            alert('Password updated successfully.');
            setPasswordPromptOpen(false);
            setNewPassword('');
        } catch (error) {
            console.error('Password update failed', error);
            alert('Failed to update password: ' + (error.response?.data?.details || error.message));
        }
    };

    return (
        <div className="animate-fade-in max-w-2xl space-y-10">
            <SectionHeader title="Security" subtitle="Password, 2FA, and active sessions." />

            {/* COMPLIANCE NOTICE */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                    <Icons.Shield size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Institutional Security Policy</h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                        Security settings are governed by organization-wide compliance protocols.
                        Some actions may require administrator verification or explicit approval.
                    </p>
                </div>
            </div>

            {/* 1. PASSWORD MANAGEMENT */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Authentication</h3>

                <div className="grid gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Last changed 90 days ago</p>

                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">Strong</span>
                                <div className="flex gap-0.5">
                                    <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
                                    <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
                                    <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
                                    <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isPasswordPromptOpen ? (
                        <button onClick={() => setPasswordPromptOpen(true)} className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-white border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors">
                            Change Password
                        </button>
                    ) : (
                        <div className="flex gap-2 animate-fade-in-left">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password (min 6 chars)"
                                className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                autoFocus
                            />
                            <button onClick={handleUpdatePassword} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                                Save
                            </button>
                            <button onClick={() => setPasswordPromptOpen(false)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <Icons.X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* SSO MESSAGE REMOVED - User has direct control now */}
                {/* 
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-100 dark:border-slate-800">
                        <Icons.Lock size={14} />
                        <span>Identity managed by <strong>{userProfile.organization || "UNESCO Identity Provider"}</strong> SSO.</span>
                    </div> 
                    */}
            </div>


            {/* 2. TWO-FACTOR AUTHENTICATION */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Two-Factor Authentication (2FA)</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Disabled</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="p-4 flex items-center justify-between group opacity-60">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                                <Icons.Smartphone size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Authenticator App</h4>
                                <p className="text-xs text-slate-500">Google Authenticator, Authy</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded uppercase tracking-wide">Coming Soon</span>
                            <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50" onClick={onOpenBackupCodes}>
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                <Icons.Lock size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Backup Codes</h4>
                                <p className="text-xs text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400">Recovery access if you lose your device</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm">View</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. ACTIVE SESSIONS */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Sessions</h3>
                    <span className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        Secure
                    </span>
                </div>

                <div className="space-y-4">
                    {loadingSessions ? (
                        <div className="py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Icons.Loader className="animate-spin" size={14} /> Refreshing session data...
                        </div>
                    ) : sessions.length > 0 ? sessions.map(session => (
                        <div key={session.id} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${session.isCurrent ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/20' : 'border-slate-200 dark:border-slate-800 opacity-70'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-md ${session.isCurrent ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                    {session.device.includes('iPhone') || session.device.includes('Android') ? <Icons.Smartphone size={20} /> : <Icons.Monitor size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {session.device}
                                        {session.isCurrent && <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-[8px] text-white rounded uppercase tracking-widest">Current</span>}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                            <Icons.MapPin size={10} />
                                            <span>{session.location}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs ${session.isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                            <Icons.Clock size={10} />
                                            <span>{session.lastActive}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {!session.isCurrent && (
                                <button
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    )) : (
                        <div className="py-8 text-center text-slate-400 italic text-xs">No active sessions found.</div>
                    )}
                </div>

                {sessions.length > 1 && (
                    <button
                        onClick={handleLogoutOthers}
                        className="w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700 mb-3"
                    >
                        Sign Out of All Other Sessions
                    </button>
                )}

                <button
                    onClick={handleSignOutAll}
                    className="w-full py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                    Sign Out All Devices
                </button>
            </div>

            {/* 4. RECENT LOGIN ACTIVITY - AUDIT LOG */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Login Activity</h3>

                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Event</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                            {auditLogs.length > 0 ? auditLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{log.event_type.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-3 text-slate-500">{log.location || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${log.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>{log.status}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">No activity recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center mt-2">
                    Showing recent activity. For full audit logs, contact your organization's administrator.
                </p>
            </div>

        </div>
    );
};


const PreferencesContent = ({ theme, setTheme }) => {
    return (
        <div className="animate-fade-in max-w-2xl">
            <SectionHeader title="Preferences" subtitle="Customize your dashboard experience." />

            <FieldGroup label="Interface Theme">
                <div className="flex gap-2">
                    {['Light', 'Dark', 'System'].map(t => {
                        const isActive = theme === t.toLowerCase();
                        return (
                            <button
                                key={t}
                                onClick={() => setTheme(t.toLowerCase())}
                                className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-all duration-300 ${isActive
                                    ? 'bg-[#002147] dark:bg-blue-600 text-white border-[#002147] dark:border-blue-600 shadow-md transform scale-[1.02]'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </FieldGroup>

            <FieldGroup label="Dashboard Language">
                <div className="relative max-w-xs">
                    <select
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70 appearance-none"
                    >
                        <option>English (Directives)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            Coming Soon
                        </span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic font-light">Additional institutional localizations are being prepared.</p>
            </FieldGroup>

            <Divider />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-tip-text-main transition-colors">Email Notifications</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">Receive weekly audit summaries.</p>
                </div>
                <div className="w-10 h-5 bg-blue-600 dark:bg-blue-500 rounded-full relative cursor-pointer transition-colors">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white dark:bg-slate-100 rounded-full shadow-sm"></div>
                </div>
            </div>
        </div>
    );
};

const BillingContent = ({ userProfile, onOpenSubscription }) => (
    <div className="animate-fade-in max-w-2xl">
        <SectionHeader title="Subscription & Billing" subtitle="Manage your subscription plan and payment details." />

        <div className="bg-[#002147] text-white rounded-lg p-6 mb-8 relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Current Plan</p>
                    <h3 className="text-2xl font-bold mb-2">{userProfile.subscription === 'Enterprise' ? 'Institutional Enterprise' : 'Audit Basic'}</h3>
                    <p className="text-sm text-blue-100/80">
                        {userProfile.subscription === 'Enterprise' ? 'Full unrestricted institutional access' : 'Individual researcher tier'}
                    </p>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold border border-white/20 uppercase tracking-widest">
                    Active
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
                <button
                    onClick={onOpenSubscription}
                    className="bg-white text-[#002147] px-4 py-2 rounded text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                    {userProfile.subscription === 'Enterprise' ? 'Manage Plan' : 'Upgrade Plan'}
                </button>
            </div>
        </div>

        <Divider />

        <Divider />

        <FieldGroup label="Billing History">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors bg-slate-50 dark:bg-slate-900/30 p-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                No billing history available.
            </div>
        </FieldGroup>
    </div>
);

const PrivacyContent = () => (
    <div className="animate-fade-in max-w-2xl">
        <SectionHeader title="Privacy & Data" subtitle="Control data retention." />

        <FieldGroup label="Data Retention Policy">
            <div className="relative">
                <select className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[4px] px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-sans cursor-pointer">
                    <option>7 Days</option>
                    <option>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400 transition-colors">
                    <Icons.ChevronRight size={14} className="rotate-90" />
                </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 transition-colors">
                Files older than this period will be automatically archived and encrypted.
            </p>
        </FieldGroup>
    </div>
);

const IntegrationsContent = () => (
    <div className="animate-fade-in max-w-2xl">
        <SectionHeader title="Integrations" subtitle="Connect external tools and manage API access." />

        <FieldGroup label="Connected Services">
            <div className="space-y-3">
                {[
                    { name: 'Slack', icon: '#4A154B', desc: 'Receive audit alerts in #compliance', active: false },
                    { name: 'Microsoft Teams', icon: '#6264A7', desc: 'Sync reports to SharePoint', active: false },
                    { name: 'Jira', icon: '#0052CC', desc: 'Create tickets from flagged issues', active: false }
                ].map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: app.icon }}>
                                {app.name[0]}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{app.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">{app.desc}</p>
                            </div>
                        </div>
                        <button
                            className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${app.active ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600' : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'}`}
                        >
                            {app.active ? 'Manage' : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>
        </FieldGroup>

    </div>
);

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { userProfile: authProfile, fetchProfile } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');
    const [isMobileView, setIsMobileView] = useState(false);
    const [mobileExited, setMobileExited] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Sync with Auth Context profile
    const [userProfile, setUserProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'Auditor',
        organization: '',
        id: '',
        subscription: 'Free',
        settings: {},
        avatarUrl: null
    });

    const [loading, setLoading] = useState(!authProfile);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (authProfile) {
            const fullName = authProfile.full_name || authProfile.name || "";
            const [first, ...rest] = fullName.split(' ');

            setUserProfile({
                firstName: first || "Auditor",
                lastName: rest.join(' ') || "",
                email: authProfile.email || "",
                role: authProfile.role || "Auditor",
                organization: authProfile.organization || "Independent",
                id: authProfile.id || "",
                subscription: authProfile.subscription_status || "Free",
                settings: authProfile.settings || {},
                avatarUrl: authProfile.avatarUrl || null
            });
            setLoading(false);
        }
    }, [authProfile]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileView(mobile);
            if (!mobile) setMobileExited(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const persistUpdates = async (updates) => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Determine which endpoint to use based on fields
            const identityFields = ['firstName', 'lastName', 'role', 'organization', 'roleDescription'];
            const hasIdentityField = Object.keys(updates).some(key => identityFields.includes(key));

            if (hasIdentityField) {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`,
                    updates,
                    { headers: { Authorization: `Bearer ${session?.access_token}` } }
                );
                // Refresh global context to update sidebar/header
                await fetchProfile(session);
            } else {
                // Otherwise update settings JSONB
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user/settings`,
                    { settings: updates },
                    { headers: { Authorization: `Bearer ${session?.access_token}` } }
                );
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpgradeSubscription = async (plan) => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user/subscription`,
                { plan },
                { headers: { Authorization: `Bearer ${session?.access_token}` } }
            );
            setUserProfile(prev => ({ ...prev, subscription: plan }));
        } catch (error) {
            console.error('Upgrade failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateProfile = (field, value) => {
        setUserProfile(prev => ({ ...prev, [field]: value }));

        // Handle name fields together or other identity fields
        if (field === 'firstName' || field === 'lastName') {
            persistUpdates({
                firstName: field === 'firstName' ? value : userProfile.firstName,
                lastName: field === 'lastName' ? value : userProfile.lastName
            });
        } else {
            persistUpdates({ [field]: value });
        }
    };

    const handleSectionClick = (sectionId) => {
        setActiveSection(sectionId);
        if (isMobileView) setMobileExited(false);
    };

    const handleMobileBack = () => {
        setMobileExited(true);
    };

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isBackupCodesOpen, setIsBackupCodesOpen] = useState(false);

    if (loading) return <div className="p-8 text-tip-text-main">Loading institutional configurations...</div>;

    const renderContent = () => {
        const props = {
            userProfile,
            handleUpdateProfile,
            isSaving,
            onOpenSubscription: () => setIsSubModalOpen(true),
            onOpenBackupCodes: () => setIsBackupCodesOpen(true)
        };
        switch (activeSection) {
            case 'profile': return <ProfileContent {...props} />;
            case 'security': return <SecurityContent {...props} />;
            case 'preferences': return <PreferencesContent {...props} setTheme={setTheme} theme={theme} />;
            case 'billing': return <BillingPage />;
            case 'privacy': return <PrivacyContent {...props} />;
            case 'integrations': return <IntegrationsContent {...props} />;
            default: return <ProfileContent {...props} />;
        }
    };

    return (
        <div className="flex h-full bg-tip-bg dark:bg-tip-bg relative overflow-hidden transition-colors duration-300">
            {/* 
               --- SETTINGS SIDEBAR (Mini Sidebar) --- 
               Desktop: Always visible on left
               Mobile: Full width when in 'list' mode (mobileExited = true)
            */}
            <aside
                className={`
                    flex-col bg-slate-50/50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-inner-gentle relative z-30
                    ${isMobileView
                        ? (mobileExited ? 'w-full flex absolute inset-0 z-10 bg-white dark:bg-slate-950' : 'hidden')
                        : `${isSidebarCollapsed ? 'w-20' : 'w-64'} min-w-0 flex`
                    }
                `}
            >
                {/* Collapse Toggle (Desktop Only) */}
                {!isMobileView && (
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all z-20 hover:scale-110"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <Icons.ChevronRight size={14} /> : <Icons.ChevronLeft size={14} />}
                    </button>
                )}
                {/* Scrollable Content Wrapper */}
                <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="py-6 px-3 space-y-1">
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => handleSectionClick(section.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                                    ${activeSection === section.id && !isMobileView
                                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                                    }
                                    ${isSidebarCollapsed && !isMobileView ? 'justify-center px-0' : 'px-4'}
                                `}
                            >
                                <section.icon size={18} className={activeSection === section.id && !isMobileView ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                                {(!isSidebarCollapsed || isMobileView) && <span className="flex-1 text-left transition-opacity duration-200">{section.label}</span>}
                                {isMobileView && <Icons.ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* 
               --- MAIN CONTENT PANEL ---
               Desktop: Always visible on right
               Mobile: Full width when in 'detail' mode (mobileExited = false)
            */}
            <main
                className={`
                    flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-tip-bg transition-colors duration-300
                    ${isMobileView
                        ? (!mobileExited ? 'absolute inset-0 z-20 overflow-y-auto bg-white dark:bg-tip-bg' : 'hidden')
                        : 'relative'
                    }
                `}
            >
                {/* Mobile Detail Header (Back Button) */}
                {isMobileView && (
                    <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2 mb-4 z-10 transition-colors">
                        <button onClick={handleMobileBack} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            <Icons.ArrowLeft size={20} />
                        </button>
                        <span className="font-semibold text-slate-900 dark:text-white transition-colors">Back to Settings</span>
                    </div>
                )}

                <div className="p-8 md:p-12 max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </main>

            <SubscriptionModal
                isOpen={isSubModalOpen}
                onClose={() => setIsSubModalOpen(false)}
                currentPlan={userProfile.subscription}
                onUpgrade={handleUpgradeSubscription}
            />
            <BackupCodesModal
                isOpen={isBackupCodesOpen}
                onClose={() => setIsBackupCodesOpen(false)}
            />
        </div>
    );
};

export default Settings;
