import React, { useMemo } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useData } from '../../contexts/DashboardContext';

const ComplianceProfile = () => {
    const { prefetchedData, integrityAvg, totalAudits, loadingHistory } = useData();

    // Fallback to local profile if fetch is still warming up, or use empty default
    const profile = useMemo(() => {
        return prefetchedData?.profile || {
            full_name: "Loading Auditor...",
            role: "Verifying...",
            institutional_id: "--------",
            stats: { flagged: 0 }
        };
    }, [prefetchedData]);

    // Derived State
    const operationalFlags = 0; // Currently hardcoded to 0 until we implement 'Flagged Scans' logic in backend
    const certifications = [
        { name: "UNESCO AI Ethics Protocol", type: "ethics", valid: "2026-12-31", status: "active" },
        { name: "Data Privacy Act RA 10173", type: "security", valid: "2027-04-15", status: "active" }
    ];

    if (loadingHistory && !prefetchedData?.profile) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-6 h-6 rounded-full border-2 border-tip-border border-t-tip-primary animate-spin"></div>
                <p className="text-[10px] font-bold text-tip-text-muted uppercase tracking-widest animate-pulse">Retrieving Personnel Record...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">

            {/* HEADER: AUDITOR IDENTITY */}
            <div className="bg-tip-surface border border-tip-border rounded-lg p-8 shadow-sm relative overflow-hidden group hover:border-tip-primary/30 transition-all duration-500">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0">
                    <Icons.Shield size={300} className="text-tip-primary" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Avatar / Monogram */}
                    <div className="relative shrink-0">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt={profile.full_name}
                                className="w-24 h-24 rounded-lg object-cover border border-tip-border shadow-sm"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-tip-bg to-tip-surface border border-tip-border flex items-center justify-center text-tip-primary font-black text-3xl shadow-inner tracking-tighter">
                                {profile.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'IA'}
                            </div>
                        )}
                        <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 border-2 border-tip-surface w-5 h-5 rounded-full shadow-sm animate-pulse-slow"></div>
                    </div>

                    {/* Details */}
                    <div className="text-center md:text-left space-y-2 flex-1">
                        <h1 className="text-3xl font-black text-tip-primary tracking-tight">{profile.full_name}</h1>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs">
                            <span className="font-bold text-tip-text-main uppercase tracking-wider flex items-center gap-1.5">
                                <Icons.User size={12} className="text-tip-access" />
                                {profile.role || "Authorized Auditor"}
                            </span>
                            <span className="text-tip-border hidden md:inline">•</span>
                            <span className="font-mono text-[10px] text-tip-text-muted bg-tip-bg px-1.5 py-0.5 rounded border border-tip-border/50">
                                ID: {profile.institutional_id || profile.id?.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-tip-border hidden md:inline">•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Clearance Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Integrity Score */}
                <InsightCard variant="highlight" className="flex flex-col justify-between h-auto min-h-[140px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-tip-primary uppercase tracking-[0.2em]">Integrity Score</span>
                        <Icons.Activity size={14} className="text-tip-primary opacity-50" />
                    </div>
                    <div className="flex items-end gap-2 mt-auto">
                        <div className="text-5xl font-black text-tip-primary tracking-tighter relative">
                            {integrityAvg}
                            <span className="absolute top-1 -right-4 text-sm text-tip-text-muted">%</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-1.5 py-0.5 rounded mb-1.5">AVG</span>
                    </div>
                    <p className="text-[9px] text-tip-text-muted mt-3 font-medium border-t border-tip-border/50 pt-2 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-tip-primary/50"></span>
                        Calculated from all sessions
                    </p>
                </InsightCard>

                {/* Audit Volume */}
                <InsightCard className="flex flex-col justify-between h-auto min-h-[140px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-tip-text-muted uppercase tracking-[0.2em]">Total Audits</span>
                        <Icons.FileText size={14} className="text-tip-text-secondary opacity-50" />
                    </div>
                    <div className="flex items-end gap-2 mt-auto">
                        <div className="text-5xl font-black text-tip-text-main tracking-tighter">
                            {totalAudits}
                        </div>
                        <span className="text-[9px] font-bold text-tip-text-muted mb-1.5">DOCS</span>
                    </div>
                    <p className="text-[9px] text-tip-text-muted mt-3 font-medium border-t border-tip-border/50 pt-2 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-tip-text-muted"></span>
                        Archived in secure database
                    </p>
                </InsightCard>

                {/* Flags/Issues */}
                <InsightCard variant={operationalFlags > 0 ? "danger" : "default"} className="flex flex-col justify-between h-auto min-h-[140px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-tip-text-muted uppercase tracking-[0.2em]">Active Flags</span>
                        <Icons.AlertCircle size={14} className={`opacity-50 ${operationalFlags > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                    </div>
                    <div className="flex items-end gap-2 mt-auto">
                        <div className={`text-5xl font-black tracking-tighter ${operationalFlags > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {operationalFlags}
                        </div>
                        <span className={`text-[9px] font-bold mb-1.5 uppercase ${operationalFlags > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {operationalFlags > 0 ? "Review Rqd" : "All Clear"}
                        </span>
                    </div>
                    <p className="text-[9px] text-tip-text-muted mt-3 font-medium border-t border-tip-border/50 pt-2 flex items-center gap-1">
                        <span className={`w-1 h-1 rounded-full ${operationalFlags > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        Real-time operational status
                    </p>
                </InsightCard>
            </div>

            {/* CERTIFICATIONS LIST */}
            <div className="bg-tip-surface border border-tip-border rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-tip-border flex items-center justify-between">
                    <h3 className="text-xs font-bold text-tip-text-main uppercase tracking-widest flex items-center gap-2">
                        <Icons.Award size={14} className="text-tip-accent" />
                        Credentials & Compliance
                    </h3>
                    <span className="text-[9px] font-mono text-tip-text-muted bg-tip-bg px-2 py-0.5 rounded">VERIFIED</span>
                </div>

                <div className="divide-y divide-tip-border">
                    {certifications.map((cert, idx) => (
                        <div key={idx} className="p-5 flex items-center justify-between group hover:bg-tip-bg/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-md bg-tip-bg text-tip-text-main border border-tip-border group-hover:border-tip-accent/30 transition-colors">
                                    {cert.type === 'ethics' ? <Icons.Globe size={18} /> : <Icons.Shield size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-tip-primary">{cert.name}</span>
                                    <span className="text-[10px] text-tip-text-muted uppercase tracking-wider">Expires: {cert.valid}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow"></span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ComplianceProfile;
