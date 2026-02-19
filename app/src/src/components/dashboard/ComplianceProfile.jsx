import React, { useMemo } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useData } from '../../contexts/DashboardContext';

const ComplianceProfile = () => {
    const { prefetchedData, integrityAvg, totalAudits, loadingHistory } = useData();

    const profile = useMemo(() => {
        return prefetchedData?.profile || {
            full_name: "Loading Auditor...",
            role: "Verifying...",
            institutional_id: "--------",
            stats: { flagged: 0 }
        };
    }, [prefetchedData]);

    const operationalFlags = 0;
    const certifications = [
        { name: "UNESCO AI Ethics Protocol", type: "ethics", valid: "2026-12-31", status: "active" },
        { name: "Data Privacy Act RA 10173", type: "security", valid: "2027-04-15", status: "active" }
    ];

    if (loadingHistory && !prefetchedData?.profile) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Retrieving Personnel Record...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-24 p-8">

            {/* AUDITOR IDENTITY GLASS PANEL */}
            <div className="glass-panel border-white/5 p-10 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-5 transition-opacity duration-1000 pointer-events-none transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0">
                    <Icons.Shield size={320} className="text-indigo-400" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative shrink-0">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt={profile.full_name}
                                className="w-28 h-28 rounded-2xl object-cover border border-white/10 shadow-premium"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-2xl glass-panel border-white/10 flex items-center justify-center text-white font-black text-4xl tracking-tighter shadow-premium">
                                {profile.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'IA'}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-tip-bg w-7 h-7 rounded-full shadow-premium animate-pulse"></div>
                    </div>

                    <div className="text-center md:text-left space-y-4 flex-1">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">{profile.full_name}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Icons.User size={12} />
                                    {profile.role || "Authorized Auditor"}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-700 hidden md:block" />
                                <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                                    ID_REF: {profile.institutional_id || profile.id?.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 glass-panel border-emerald-500/20 bg-emerald-500/5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Personnel Status: Active Clearance</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightCard variant="highlight" className="flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Operational Integrity</span>
                        <Icons.Activity size={14} className="text-indigo-400 opacity-50" />
                    </div>
                    <div className="mt-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">{integrityAvg}</span>
                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">%</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-4 pt-4 border-t border-white/5">Mean Compliance Quotient</p>
                    </div>
                </InsightCard>

                <InsightCard className="flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Verification Volume</span>
                        <Icons.FileText size={14} className="text-slate-500 opacity-50" />
                    </div>
                    <div className="mt-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">{totalAudits}</span>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Nodes</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-4 pt-4 border-t border-white/5">Archived Assessments</p>
                    </div>
                </InsightCard>

                <InsightCard variant={operationalFlags > 0 ? "danger" : "default"} className="flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Active forensic alerts</span>
                        <Icons.AlertCircle size={14} className={`opacity-50 ${operationalFlags > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                    </div>
                    <div className="mt-6">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-6xl font-black tracking-tighter ${operationalFlags > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {operationalFlags}
                            </span>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Signals</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-4 pt-4 border-t border-white/5">Real-time discrepancies</p>
                    </div>
                </InsightCard>
            </div>

            {/* CREDENTIALS SECTION */}
            <div className="glass-panel border-white/5 rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <Icons.Award size={16} className="text-indigo-400" />
                        Compliance Certifications
                    </h3>
                    <div className="px-3 py-1 glass-panel border-white/10 rounded-lg">
                        <span className="text-[9px] font-mono text-slate-500 tracking-widest">CRYPT_VERIFIED</span>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {certifications.map((cert, idx) => (
                        <div key={idx} className="px-8 py-6 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 glass-panel border-white/10 rounded-xl flex items-center justify-center text-white group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                    {cert.type === 'ethics' ? <Icons.Globe size={20} /> : <Icons.Shield size={20} />}
                                </div>
                                <div>
                                    <span className="text-sm font-black text-white tracking-tight">{cert.name}</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Valid until {cert.valid}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-1.5 glass-panel border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ComplianceProfile;

