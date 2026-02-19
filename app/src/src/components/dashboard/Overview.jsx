import React, { useState, useMemo, useCallback } from 'react';
import Loader from '../ui/Loader';
import Icons from '../ui/Icons';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';

const DocumentCard = React.memo(({ file, openMenuId, toggleMenu, loadFile, handleDeleteClick }) => {
    const cardRef = React.useRef(null);
    const confidenceScore = normalizeConfidence(file.confidence);
    const isScanning = file.status?.toLowerCase() === 'scanning' || file.status?.toLowerCase() === 'processing';
    const [wasScanning, setWasScanning] = React.useState(isScanning);

    useGSAP(() => {
        if (wasScanning && !isScanning) {
            gsap.fromTo(cardRef.current,
                { scale: 0.95, filter: 'brightness(1.5)' },
                { scale: 1, filter: 'brightness(1)', duration: 1, ease: "expo.out" }
            );
        }
        setWasScanning(isScanning);
    }, [isScanning]);

    return (
        <div
            ref={cardRef}
            onClick={() => !isScanning && loadFile(file)}
            className={`glass-card p-0 h-64 flex flex-col relative overflow-hidden fade-in-item opacity-0 group transition-all duration-500
                ${isScanning ? 'cursor-wait border-indigo-500/30' : 'cursor-pointer hover:-translate-y-2 hover:border-indigo-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]'}
            `}
        >
            {/* Top Visual Section */}
            <div className={`relative h-32 flex flex-col items-center justify-center border-b border-white/5 transition-colors duration-500
                ${isScanning ? 'bg-indigo-500/5' : 'bg-white/5'}
            `}>
                {/* Glow Background */}
                <div className={`absolute inset-0 opacity-20 blur-3xl transition-colors duration-500
                    ${isScanning ? 'bg-indigo-600' : (confidenceScore > 70 ? 'bg-rose-500' : 'bg-emerald-500')}
                `} />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`w-12 h-16 glass-panel rounded-lg flex items-center justify-center border-white/10 transition-transform duration-500 group-hover:scale-110
                        ${isScanning ? 'animate-pulse text-indigo-400' : 'text-slate-400'}
                    `}>
                        {isScanning ? (
                            <div className="w-16 h-16">
                                <DotLottieReact
                                    src="https://lottie.host/8908b664-402b-4f65-ab5f-122e42a0eaff/lJD6OSQpKY.lottie"
                                    loop autoplay
                                />
                            </div>
                        ) : (
                            <Icons.FileText size={24} strokeWidth={1.5} />
                        )}
                    </div>
                </div>

                {/* Score Badge */}
                {!isScanning && (
                    <div className="absolute top-4 right-4 h-10 w-10 glass-panel rounded-xl flex flex-col items-center justify-center border-white/10">
                        <span className={`text-[10px] font-black leading-none ${confidenceScore > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {confidenceScore}%
                        </span>
                        <span className="text-[6px] font-bold text-slate-500 uppercase mt-1">Audit</span>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-black text-white truncate flex-1 tracking-tight">
                            {file.title || "Unknown Terminal Input"}
                        </h4>
                        <button
                            onClick={(e) => toggleMenu(e, file.id)}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <Icons.MoreHorizontal size={14} />
                        </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{file.date || "Dec 26, 2025"}</p>
                </div>

                <div className="space-y-3">
                    {isScanning ? (
                        <div className="space-y-2">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 animate-progress-loading w-1/2" />
                            </div>
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">Running Deep Heuristics...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                                ${confidenceScore > 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                            `}>
                                {confidenceScore > 70 ? 'At Risk' : 'Clear'}
                            </div>
                            <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${confidenceScore > 70 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                                    style={{ width: `${confidenceScore}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown Menu */}
            {openMenuId === file.id && (
                <div className="absolute top-12 right-4 w-40 glass-panel border-white/10 rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                    <button className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                        <Icons.RefreshCw size={12} /> RE-SCAN
                    </button>
                    <button
                        onClick={(e) => handleDeleteClick(e, file.id)}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                    >
                        <Icons.Trash2 size={12} /> TERMINATE
                    </button>
                </div>
            )}
        </div>
    );
});

const Overview = () => {
    const { files, searchTerm, integrityAvg, totalAudits, loadingHistory } = useData();
    const { setDashboardState, loadFile, deleteAnalysis } = useActions();

    const [openMenuId, setOpenMenuId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const filteredFiles = useMemo(() => {
        if (!Array.isArray(files)) return [];
        return files.filter(file =>
            file.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [files, searchTerm]);

    useGSAP(() => {
        if (loadingHistory) return;
        gsap.fromTo(".fade-in-item",
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: "expo.out", delay: 0.2 }
        );
    }, [files.length, loadingHistory]);

    const toggleMenu = useCallback((e, id) => {
        e.stopPropagation();
        setOpenMenuId(prev => prev === id ? null : id);
    }, []);

    const handleDeleteClick = useCallback((e, id) => {
        e.stopPropagation();
        setOpenMenuId(null);
        setDeleteConfirmId(id);
    }, []);

    const confirmDelete = async () => {
        if (deleteConfirmId) {
            await deleteAnalysis(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    if (loadingHistory) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <Loader />
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-8 animate-pulse">Establishing Secure Uplink</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col px-6 md:px-10 py-8 overflow-y-auto custom-scrollbar bg-tip-bg" onClick={() => setOpenMenuId(null)}>

            {/* Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 fade-in-item opacity-0">
                <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 blur-2xl rounded-full transition-transform group-hover:scale-150" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">Total Audits</span>
                    <span className="text-4xl font-extrabold text-white tracking-tighter">{totalAudits || files.length}</span>
                </div>
                <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full transition-transform group-hover:scale-150" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">Avg Integrity</span>
                    <span className="text-4xl font-extrabold text-emerald-400 tracking-tighter">{integrityAvg}%</span>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-8 fade-in-item opacity-0">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Resource Archive</h3>
                    <div className="h-[1px] flex-1 bg-white/5 mx-8 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                    {/* Add Card */}
                    <div
                        onClick={() => setDashboardState('UPLOAD')}
                        className="glass-card border-2 border-dashed border-white/5 h-64 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 hover:bg-white/5 transition-all duration-500 fade-in-item opacity-0 hover:-translate-y-2"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-4">
                            <Icons.Plus size={28} />
                        </div>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">New Analysis</span>
                    </div>

                    {filteredFiles.map(f => (
                        <DocumentCard
                            key={f.id}
                            file={f}
                            openMenuId={openMenuId}
                            toggleMenu={toggleMenu}
                            loadFile={loadFile}
                            handleDeleteClick={handleDeleteClick}
                        />
                    ))}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />
                    <div className="glass-card max-w-sm w-full p-8 relative z-10 border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                            <Icons.Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-2 tracking-tight">Confirm Deletion</h3>
                        <p className="text-[12px] font-bold text-slate-500 text-center mb-8 uppercase tracking-tight">This action will permanently purge the record.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setDeleteConfirmId(null)} className="h-12 glass-panel font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="h-12 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors shadow-[0_10px_20px_rgba(244,63,94,0.3)]">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;

