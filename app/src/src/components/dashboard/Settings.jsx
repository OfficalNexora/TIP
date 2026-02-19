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
    { id: 'preferences', label: 'Preferences', icon: Icons.Settings },
    { id: 'billing', label: 'Subscription & Billing', icon: Icons.CreditCard },
    { id: 'privacy', label: 'Privacy & Data', icon: Icons.Shield },
    { id: 'integrations', label: 'Integrations', icon: Icons.Grid },
];

// --- Sub-Components ---

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-10 border-b border-white/5 pb-6">
        <h2 className="text-2xl font-black text-white tracking-tighter">{title}</h2>
        {subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">{subtitle}</p>}
    </div>
);

const FieldGroup = ({ label, children }) => (
    <div className="mb-8">
        <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">{label}</label>
        {children}
    </div>
);

const InputField = ({ type = "text", defaultValue, readOnly }) => (
    <input
        type={type}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="glass-input w-full"
    />
);

const Divider = () => <div className="h-px bg-white/5 w-full my-8" />;

// --- Content Sections ---

const UpdateNameModal = ({ isOpen, onClose, currentFirstName, currentLastName, onUpdate }) => {
    const [firstName, setFirstName] = useState(currentFirstName);
    const [lastName, setLastName] = useState(currentLastName);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFirstName(currentFirstName);
            setLastName(currentLastName);
        }
    }, [isOpen, currentFirstName, currentLastName]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(firstName, lastName);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-500" onClick={onClose} />
            <div className="relative glass-panel border-white/10 shadow-premium w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Identity Refactoring</h3>
                    <button onClick={onClose} className="w-8 h-8 glass-panel border-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        <Icons.X size={14} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Primary Designation</label>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="glass-input w-full"
                                placeholder="First Name"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Secondary Designation</label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="glass-input w-full"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 glass-panel border-indigo-500/20 bg-indigo-500/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-indigo-500/20 transition-all shadow-premium flex items-center justify-center gap-3"
                        >
                            {isSaving ? <Icons.Loader className="animate-spin" size={16} /> : 'Commit Changes'}
                        </button>
                    </div>
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
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(value);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-500" onClick={onClose} />
            <div className="relative glass-panel border-white/10 shadow-premium w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 glass-panel border-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        <Icons.X size={14} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{label}</label>
                        {type === "textarea" ? (
                            <textarea
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="glass-input w-full min-h-[120px] resize-none"
                                placeholder="..."
                            />
                        ) : (
                            <input
                                type={type}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="glass-input w-full"
                                placeholder="..."
                            />
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 glass-panel border-indigo-500/20 bg-indigo-500/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-indigo-500/20 transition-all shadow-premium flex items-center justify-center gap-3"
                        >
                            {isSaving ? <Icons.Loader className="animate-spin" size={16} /> : 'Secure Update'}
                        </button>
                    </div>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-500" onClick={onClose} />
            <div className="relative glass-panel border-white/10 shadow-premium w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Institutional Uplink Change</h3>
                    <button onClick={onClose} className="w-8 h-8 glass-panel border-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        <Icons.X size={14} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 glass-panel border-red-500/20 bg-red-500/5 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">New Credential Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full"
                            placeholder="name@agency.gov"
                        />
                    </div>

                    {!isSocialUser ? (
                        <div className="space-y-4">
                            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Security Authorization</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input w-full"
                                placeholder="Authorization Required"
                            />
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-2">
                                Verification codes will be broadcast to both current and target archives.
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 glass-panel border-indigo-500/10 bg-indigo-500/5 rounded-xl">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic leading-relaxed">
                                Note: Identity verification is federated via {session?.user?.app_metadata?.provider}.
                            </p>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="w-full py-4 glass-panel border-indigo-500/20 bg-indigo-500/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-indigo-500/20 transition-all shadow-premium disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Icons.Loader className="animate-spin" size={16} /> : 'Authorize Change'}
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
                        'Content-Type': 'multipart/form-type'
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
        <div className="animate-fade-in max-w-4xl space-y-16 pb-24">
            <SectionHeader title="Auditor Identity" subtitle="Archive level personnel configurations and credentials." />

            {/* 1. IDENTITY INFORMATION */}
            <section className="space-y-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Biometric Registry</h3>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                    {/* Avatar */}
                    <div className="group relative shrink-0">
                        <div className="w-40 h-40 rounded-3xl glass-panel border-white/10 flex items-center justify-center overflow-hidden shadow-premium relative group-hover:border-indigo-500/40 transition-all duration-700">
                            {avatarUploading ? (
                                <Icons.Loader className="animate-spin text-indigo-400" size={32} />
                            ) : localAvatarUrl ? (
                                <img src={localAvatarUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <span className="text-4xl font-black text-white tracking-tighter opacity-20">
                                    {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                                </span>
                            )}

                            {/* Upload Overlay */}
                            {!avatarUploading && (
                                <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 cursor-pointer">
                                    <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-white">
                                        <Icons.Camera size={24} />
                                    </div>
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
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 glass-panel border-white/20 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                            <Icons.Check size={14} />
                        </div>
                    </div>

                    <div className="flex-1 w-full space-y-8">
                        <FieldGroup label="Full Legal Identity">
                            <div className="flex items-center justify-between p-4 glass-panel border-white/5 bg-white/[0.01] rounded-2xl group hover:border-white/10 transition-all">
                                <span className="text-lg font-black text-white tracking-tight">
                                    {userProfile.firstName} {userProfile.lastName}
                                </span>
                                <button
                                    onClick={() => setIsNameModalOpen(true)}
                                    className="px-4 py-2 glass-panel border-white/5 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Modify
                                </button>
                            </div>
                        </FieldGroup>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FieldGroup label="Institutional Uplink">
                                <div className="flex items-center justify-between p-4 glass-panel border-white/5 bg-white/[0.01] rounded-2xl group hover:border-white/10 transition-all">
                                    <span className="text-xs text-slate-400 font-mono truncate max-w-[160px]">{userProfile.email}</span>
                                    <button
                                        onClick={() => setActiveModal('email')}
                                        className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:underline"
                                    >
                                        Update
                                    </button>
                                </div>
                            </FieldGroup>

                            <FieldGroup label="Deployment ID">
                                <div className="flex items-center justify-between p-4 glass-panel border-white/5 bg-white/[0.01] rounded-2xl">
                                    <span className="text-xs text-slate-500 font-mono truncate max-w-[140px]" title={sessionData.id}>{sessionData.id}</span>
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-500/10 rounded text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                        <Icons.Lock size={10} />
                                        Secure
                                    </div>
                                </div>
                            </FieldGroup>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. ORGANIZATION & ROLE */}
            <section className="space-y-10 pt-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Professional Mandate</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FieldGroup label="Official Organization">
                        <div className="flex items-center justify-between p-4 glass-panel border-white/5 bg-white/[0.01] rounded-2xl group hover:border-white/10 transition-all">
                            <span className="text-base font-black text-white tracking-tight">{userProfile.organization}</span>
                            <button
                                onClick={() => setActiveModal('org')}
                                className="px-4 py-2 glass-panel border-white/5 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Edit
                            </button>
                        </div>
                    </FieldGroup>

                    <FieldGroup label="Designated Role">
                        <div className="flex items-center justify-between p-4 glass-panel border-white/5 bg-white/[0.01] rounded-2xl group hover:border-white/10 transition-all">
                            <span className="text-base font-black text-white tracking-tight">{userProfile.role}</span>
                            <button
                                onClick={() => setActiveModal('role')}
                                className="px-4 py-2 glass-panel border-white/5 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Edit
                            </button>
                        </div>
                    </FieldGroup>
                </div>
            </section>

            {/* 3. PREFERENCES */}
            <section className="space-y-10 pt-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Interface Parameters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FieldGroup label="Terminal Alias">
                        <input
                            type="text"
                            value={preferences.displayName}
                            onChange={(e) => handlePreferenceUpdate('displayName', e.target.value)}
                            className="glass-input w-full"
                        />
                    </FieldGroup>

                    <FieldGroup label="Temporal Zone">
                        <div className="relative">
                            <select
                                value={preferences.timezone}
                                onChange={(e) => handlePreferenceUpdate('timezone', e.target.value)}
                                className="glass-input w-full appearance-none cursor-pointer pr-10"
                            >
                                <option value="Asia/Manila">Asia/Manila (UTC+08:00)</option>
                                <option value="UTC">UTC (UTC+00:00)</option>
                                <option value="America/New_York">Eastern Time (UTC-05:00)</option>
                            </select>
                            <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        </div>
                    </FieldGroup>
                </div>
            </section>

            {/* 4. ACCOUNT METRICS */}
            <div className="glass-panel border-white/5 bg-indigo-500/[0.02] rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-8 items-center border-l-4 border-l-indigo-500">
                <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Institutional Record Metrics</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Archive Active since {new Date(sessionData.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="px-4 py-2 glass-panel border-emerald-500/20 bg-emerald-500/5 rounded-xl flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Authenticated</span>
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
                type="textarea"
            />

            <UpdateEmailModal
                isOpen={activeModal === 'email'}
                onClose={() => setActiveModal(null)}
            />
        </div>
    );
};

const BackupCodesModal = ({ isOpen, onClose }) => {
    const codes = ["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6", "Q7R8-S9T0", "U1V2-W3X4", "Y5Z6-A7B8", "C9D0-E1F2"];

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-500" onClick={onClose} />
            <div className="relative glass-panel border-white/10 shadow-premium w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Icons.Key className="text-indigo-400" size={18} />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Recovery Authorization</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 glass-panel border-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        <Icons.X size={14} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="p-4 glass-panel border-amber-500/20 bg-amber-500/5 rounded-xl">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
                            Warning: These codes allow bypass of 2FA. Store them in a secure physical vault.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {codes.map((code, i) => (
                            <div key={i} className="glass-panel border-white/5 bg-white/[0.02] p-4 rounded-xl text-center">
                                <span className="text-xs font-black text-white font-mono tracking-tighter">{code}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button className="flex-1 py-4 glass-panel border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3">
                            <Icons.Copy size={14} />
                            Copy codes
                        </button>
                        <button className="flex-1 py-4 glass-panel border-indigo-500/20 bg-indigo-500/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-indigo-500/20 transition-all shadow-premium flex items-center justify-center gap-3">
                            <Icons.Download size={14} />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const SecurityContent = ({ handleBackupCodes, handleSignOutAll, auditLogs = [] }) => {
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoadingSessions(true);
            try {
                // In real app: const response = await axios.get('/api/auth/sessions');
                setSessions([
                    { id: '1', device: 'Chrome on macOS', location: 'Manila, PH', lastActive: 'Active Now', isCurrent: true },
                    { id: '2', device: 'Safari on iPhone', location: 'Quezon City, PH', lastActive: '2 hours ago', isCurrent: false }
                ]);
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            } finally {
                setLoadingSessions(false);
            }
        };
        fetchSessions();
    }, []);

    const handleRevokeSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        // api.delete(`/auth/sessions/${id}`)
    };

    const handleLogoutOthers = () => {
        setSessions(prev => prev.filter(s => s.isCurrent));
        // api.post('/auth/sessions/logout-others')
    };

    return (
        <div className="animate-fade-in max-w-4xl space-y-16 pb-24">
            <SectionHeader title="Security Protocol" subtitle="Hardened authentication and active session management." />

            {/* 1. PASSWORD & 2FA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Access Control</h3>
                    </div>

                    <FieldGroup label="Authentication Pattern">
                        <div className="glass-panel border-white/5 bg-white/[0.01] rounded-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-white tracking-tight">Main Password</span>
                                <button className="px-4 py-2 glass-panel border-white/5 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all">
                                    Update
                                </button>
                            </div>
                        </div>
                    </FieldGroup>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Multi-Factor</h3>
                    </div>

                    <div className="glass-panel border-emerald-500/20 bg-emerald-500/[0.02] rounded-3xl p-6 border-l-4 border-l-emerald-500 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 glass-panel border-emerald-500/10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                <Icons.ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Two-Factor Auth</h4>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Status: Active</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 glass-panel border-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">
                            Configure
                        </button>
                    </div>
                </section>
            </div>

            {/* 2. RECOVERY CODES */}
            <FieldGroup label="Emergency Recovery Archway">
                <div className="glass-panel border-white/5 bg-indigo-500/[0.02] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 glass-panel border-white/10 bg-white/[0.02] rounded-2xl flex items-center justify-center text-indigo-400">
                            <Icons.Key size={28} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white tracking-tight">System Recovery Codes</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Secure physical backup for account reclamation.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBackupCodes}
                        className="px-8 py-3 glass-panel border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/5 transition-all active:scale-95"
                    >
                        Review Codes
                    </button>
                </div>
            </FieldGroup>

            {/* 3. ACTIVE SESSIONS */}
            <section className="space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Active Uplinks</h3>
                    </div>
                    <div className="px-3 py-1 glass-panel border-emerald-500/20 bg-emerald-500/5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Encrypted</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loadingSessions ? (
                        <div className="col-span-2 py-20 glass-panel border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4">
                            <Icons.Loader className="animate-spin text-indigo-500" size={32} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decrypting session registry...</span>
                        </div>
                    ) : sessions.length > 0 ? sessions.map(session => (
                        <div key={session.id} className={`glass-panel p-6 rounded-3xl transition-all duration-500 border-white/5 hover:border-white/10 group ${session.isCurrent ? 'bg-indigo-500/[0.03] ring-1 ring-indigo-500/20' : 'bg-white/[0.01]'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-4 rounded-2xl glass-panel ${session.isCurrent ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400' : 'border-white/5 bg-white/5 text-slate-500'}`}>
                                    {session.device.includes('iPhone') || session.device.includes('Android') ? <Icons.Smartphone size={24} /> : <Icons.Monitor size={24} />}
                                </div>
                                {session.isCurrent ? (
                                    <span className="px-3 py-1 glass-panel border-indigo-500/30 bg-indigo-500/20 text-[8px] font-black text-indigo-400 rounded-full uppercase tracking-widest">Current Terminal</span>
                                ) : (
                                    <button
                                        onClick={() => handleRevokeSession(session.id)}
                                        className="text-[9px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors"
                                    >
                                        Revoke Access
                                    </button>
                                )}
                            </div>
                            <h4 className="text-sm font-black text-white tracking-tight">{session.device}</h4>
                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wider">
                                    <Icons.MapPin size={12} className="text-indigo-400" />
                                    <span>{session.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wider">
                                    <Icons.Clock size={12} className="text-indigo-400" />
                                    <span>{session.lastActive}</span>
                                </div>
                            </div>
                        </div>
                    )) : null}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={handleLogoutOthers}
                        className="flex-1 py-4 glass-panel border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                    >
                        Purge Other Uplinks
                    </button>
                    <button
                        onClick={handleSignOutAll}
                        className="flex-1 py-4 glass-panel border-red-500/20 bg-red-500/5 rounded-2xl text-[10px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/10 transition-all"
                    >
                        Global Logout Purge
                    </button>
                </div>
            </section>

            {/* 4. AUDIT LOG */}
            <section className="space-y-10">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Archival Access Logs</h3>
                </div>

                <div className="glass-panel border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="border-b border-white/5 bg-white/[0.02]">
                            <tr>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Event</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Loc</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Ref</th>
                                <th className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {auditLogs.length > 0 ? auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-8 py-5 text-xs font-black text-white uppercase tracking-wider">{log.event_type.replace(/_/g, ' ')}</td>
                                    <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{log.location || 'Remote Uplink'}</td>
                                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${log.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No archive events detected</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};


const PreferencesContent = ({ theme, setTheme }) => {
    return (
        <div className="animate-fade-in max-w-2xl space-y-12">
            <SectionHeader title="Protocol Preferences" subtitle="Customize terminal interface and notification parameters." />

            <FieldGroup label="Visual Interface Mode">
                <div className="grid grid-cols-3 gap-4">
                    {['Light', 'Dark', 'System'].map(t => {
                        const isActive = theme === t.toLowerCase();
                        return (
                            <button
                                key={t}
                                onClick={() => setTheme(t.toLowerCase())}
                                className={`
                                    px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500
                                    ${isActive
                                        ? 'glass-panel bg-white/5 border-indigo-500/40 text-indigo-400 shadow-premium scale-[1.02]'
                                        : 'glass-panel border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                                    }
                                `}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </FieldGroup>

            <FieldGroup label="Terminal Directives">
                <div className="p-6 glass-panel border-white/5 bg-indigo-500/[0.02] rounded-3xl space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Auto-Archive Signals</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receive weekly audit summaries via uplink.</p>
                        </div>
                        <div className="w-12 h-6 glass-panel bg-indigo-500/20 border-white/5 rounded-full relative cursor-not-allowed opacity-50">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-indigo-400 rounded-full shadow-premium" />
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="flex items-center justify-between opacity-50">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Heuristic Feedback</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alert on high-risk pattern detection.</p>
                        </div>
                        <div className="w-12 h-6 glass-panel bg-white/5 border-white/5 rounded-full relative cursor-not-allowed">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full" />
                        </div>
                    </div>
                </div>
            </FieldGroup>
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
    <div className="animate-fade-in max-w-4xl space-y-16 pb-24">
        <SectionHeader title="Archive Retention" subtitle="Configure data lifecycle and temporal persistence." />

        <FieldGroup label="Temporal Buffer Threshold">
            <div className="relative">
                <select className="glass-input w-full appearance-none cursor-pointer pr-10">
                    <option>7 Cycles (Short-term)</option>
                    <option>30 Cycles (Standard)</option>
                    <option>60 Cycles (Extended)</option>
                    <option>90 Cycles (Archive Grade)</option>
                </select>
                <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 leading-relaxed">
                Archives older than this temporal threshold will be automatically encrypted and offloaded to dormant storage.
            </p>
        </FieldGroup>
    </div>
);

const IntegrationsContent = () => (
    <div className="animate-fade-in max-w-4xl space-y-16 pb-24">
        <SectionHeader title="Cross-Terminal Uplinks" subtitle="Establish secure protocols with validated external subsystems." />

        <FieldGroup label="Validated Subsystems">
            <div className="grid grid-cols-1 gap-6">
                {[
                    { name: 'Slack Protocol', icon: '#4A154B', desc: 'Real-time broadcast to #compliance-stream', active: false },
                    { name: 'Teams Network', icon: '#6264A7', desc: 'Synchronized archival to institutional SharePoint', active: false },
                    { name: 'Jira Nexus', icon: '#0052CC', desc: 'Automated artifact generation for verified events', active: false }
                ].map((app, i) => (
                    <div key={i} className="glass-panel p-6 border-white/5 bg-white/[0.01] rounded-3xl flex items-center justify-between hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl glass-panel border-white/10 flex items-center justify-center text-white font-black text-xl shadow-premium" style={{ backgroundColor: app.icon }}>
                                {app.name[0]}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{app.name}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{app.desc}</p>
                            </div>
                        </div>
                        <button
                            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${app.active ? 'glass-panel border-white/10 text-slate-400' : 'glass-panel border-indigo-500/20 bg-indigo-500/10 text-white hover:bg-indigo-500/20'}`}
                        >
                            {app.active ? 'Configure' : 'Establish Uplink'}
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

    const handleUpgradeSubscription = (planId) => {
        setActiveSection('billing');
        setIsSubModalOpen(false);
    };

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
        <div className="flex h-full bg-tip-bg relative overflow-hidden transition-colors duration-300">
            {/* 
               --- SETTINGS SIDEBAR --- 
            */}
            <aside
                className={`
                    flex-col bg-slate-950/20 glass-panel border-r border-white/5 transition-all duration-500 relative z-30
                    ${isMobileView
                        ? (mobileExited ? 'w-full flex absolute inset-0 z-10 bg-tip-bg' : 'hidden')
                        : `${isSidebarCollapsed ? 'w-20' : 'w-72'} min-w-0 flex`
                    }
                `}
            >
                {/* Collapse Toggle */}
                {!isMobileView && (
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute -right-3 top-10 w-6 h-6 glass-panel border-white/10 rounded flex items-center justify-center text-slate-500 hover:text-white transition-all z-20 hover:scale-110 active:scale-90 shadow-premium"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <Icons.ChevronRight size={12} /> : <Icons.ChevronLeft size={12} />}
                    </button>
                )}

                <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
                    <div className="mb-10 pl-2">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Institutional</div>
                        <h2 className="text-sm font-black text-white tracking-widest uppercase mt-1">Registry</h2>
                    </div>

                    <div className="space-y-2">
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => handleSectionClick(section.id)}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black transition-all group
                                    ${activeSection === section.id && !isMobileView
                                        ? 'glass-panel bg-white/5 border-indigo-500/30 text-indigo-400 shadow-premium'
                                        : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'
                                    }
                                    ${isSidebarCollapsed && !isMobileView ? 'justify-center px-0' : ''}
                                `}
                            >
                                <section.icon size={18} className={activeSection === section.id && !isMobileView ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400 transition-colors'} />
                                {(!isSidebarCollapsed || isMobileView) && <span className="flex-1 text-left uppercase tracking-widest">{section.label}</span>}
                                {isMobileView && <Icons.ChevronRight size={14} className="text-slate-700" />}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* 
               --- MAIN CONTENT PANEL ---
            */}
            <main
                className={`
                    flex-1 overflow-y-auto custom-scrollbar bg-tip-bg transition-all duration-500
                    ${isMobileView
                        ? (!mobileExited ? 'absolute inset-0 z-20 overflow-y-auto bg-tip-bg' : 'hidden')
                        : 'relative'
                    }
                `}
            >
                {/* Mobile Detail Header */}
                {isMobileView && (
                    <div className="sticky top-0 bg-tip-bg/90 backdrop-blur-md border-b border-white/5 px-6 py-5 flex items-center gap-4 mb-4 z-40">
                        <button onClick={handleMobileBack} className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <Icons.ArrowLeft size={18} />
                        </button>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Archive Level Ref: {activeSection.toUpperCase()}</span>
                    </div>
                )}

                <div className="p-10 md:p-20 max-w-5xl mx-auto">
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
