import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';

const ComplianceProfile = ({ integrityAvg, totalAudits }) => {
    const { userProfile: profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-tip-border border-t-tip-primary animate-spin"></div>
            </div>
        );
    }

    if (!profile) return (
        <div className="p-8 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-bold uppercase tracking-widest">
            Nabigo ang Authorization. Please re-authenticate.
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-12">

            {/* AUDITOR IDENTIFICATION CARD */}
            <div className="bg-tip-surface border border-tip-border rounded-lg p-10 shadow-sm relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Icons.Shield size={240} className="text-tip-primary dark:text-tip-accent" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-lg bg-tip-bg border border-tip-border flex items-center justify-center text-tip-primary dark:text-tip-accent font-bold text-4xl shadow-md uppercase transition-colors">
                            {profile.name?.split(' ').map(n => n[0]).join('') || 'IA'}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-tip-surface w-8 h-8 rounded-full shadow-sm"></div>
                    </div>

                    <div className="text-center md:text-left space-y-3">
                        <div>
                            <h1 className="text-4xl font-black text-tip-primary tracking-tight">{profile.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
                                <span className="text-xs font-bold text-tip-text-muted uppercase tracking-[0.2em]">{profile.role}</span>
                                <span className="text-tip-border">•</span>
                                <span className="font-mono text-[10px] bg-tip-bg border border-tip-border px-2 py-0.5 rounded text-tip-text-muted transition-colors">UID: {profile.id?.slice(0, 8) || 'SYSTEM'}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Icons.CheckCircle size={14} /> Account Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PERFORMANCE METRICS (Using Live Props) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <InsightCard variant="highlight" className="flex flex-col">
                    <span className="text-[10px] font-bold text-tip-primary uppercase tracking-[0.2em] mb-4">Historical Integrity</span>
                    <div className="flex items-end gap-3">
                        <span className="text-6xl font-black text-tip-primary dark:text-tip-accent tracking-tighter transition-colors">{integrityAvg}%</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md mb-2 transition-colors">LIVE DATA</span>
                    </div>
                    <p className="text-[10px] text-tip-text-muted mt-6 font-bold uppercase tracking-widest border-t border-tip-border pt-4">Base sa lahat ng sessions</p>
                </InsightCard>

                <InsightCard className="flex flex-col">
                    <span className="text-[10px] font-bold text-tip-text-muted uppercase tracking-[0.2em] mb-4">Formal Audits</span>
                    <div className="flex items-end gap-3">
                        <span className="text-6xl font-black text-tip-primary tracking-tighter">{totalAudits}</span>
                        <span className="text-xs font-bold text-tip-text-muted mb-2 uppercase tracking-widest">Total</span>
                    </div>
                    <p className="text-[10px] text-tip-text-muted mt-6 font-bold uppercase tracking-widest border-t border-tip-border pt-4">Naka-save sa Database</p>
                </InsightCard>

                <InsightCard variant={profile.stats?.flagged?.value > 0 ? "danger" : "default"} className="flex flex-col">
                    <span className="text-[10px] font-bold text-tip-text-muted uppercase tracking-[0.2em] mb-4">Operational Flags</span>
                    <div className="flex items-end gap-3">
                        <span className="text-6xl font-black text-tip-primary tracking-tighter">{profile.stats?.flagged?.value || 0}</span>
                        <div className="flex flex-col mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${profile.stats?.flagged?.value > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                {profile.stats?.flagged?.value > 0 ? "Kailangan ng Pansin" : "Walang Isyu"}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-tip-text-muted mt-6 font-bold uppercase tracking-widest border-t border-tip-border pt-4">Real-time na monitoring</p>
                </InsightCard>
            </div>

            {/* INSTITUTIONAL CREDENTIALS */}
            <div className="bg-tip-surface border border-tip-border rounded-lg p-8 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-tip-primary dark:text-tip-text-main uppercase tracking-[0.2em] flex items-center gap-3 transition-colors">
                        <Icons.Award size={18} className="text-tip-accent" />
                        Active na Certifications
                    </h3>
                    <span className="text-[9px] font-mono text-tip-text-muted uppercase">Status: OK</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(profile.certs || []).map((cert, index) => (
                        <div key={index} className="flex items-center justify-between p-6 border border-tip-border rounded-lg hover:border-tip-primary/30 dark:hover:border-tip-accent/30 hover:bg-tip-bg transition-all group">
                            <div className="flex items-center gap-5">
                                <div className={`p-3 rounded bg-tip-primary/5 dark:bg-tip-accent/5 text-tip-primary dark:text-tip-accent border border-tip-primary/10 dark:border-tip-accent/10 transition-colors`}>
                                    {cert.type === 'security' ? <Icons.Shield size={20} /> :
                                        cert.type === 'ethics' ? <Icons.Globe size={20} /> : <Icons.FileText size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-tip-primary dark:text-tip-text-main text-sm group-hover:text-tip-accent transition-colors">{cert.name}</h4>
                                    <p className="text-[10px] text-tip-text-muted font-bold uppercase tracking-widest mt-1">Mag-eexpire sa: {cert.valid}</p>
                                </div>
                            </div>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded uppercase tracking-[0.2em] transition-colors">Verified</span>
                        </div>
                    ))}
                </div>
            </div >
        </div >
    );
};

export default ComplianceProfile;
