import React, { useState, useMemo, useCallback } from 'react';
import Loader from '../ui/Loader';
import Icons from '../ui/Icons';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import InsightCard from '../ui/InsightCard';
import { useDashboard } from '../../contexts/DashboardContext';

import { normalizeConfidence } from '../../utils/confidenceUtils';

const DocumentCard = React.memo(({ file, openMenuId, toggleMenu, loadFile, handleDeleteClick }) => {
    const cardRef = React.useRef(null);
    const confidenceScore = normalizeConfidence(file.confidence);
    const isScanning = file.status?.toLowerCase() === 'scanning' || file.status?.toLowerCase() === 'processing';
    const [wasScanning, setWasScanning] = React.useState(isScanning);

    // Transition Animation when scan finishes
    useGSAP(() => {
        if (wasScanning && !isScanning) {
            const tl = gsap.timeline();
            tl.to(cardRef.current, { backgroundColor: '#3b82f6', duration: 0.2 })
                .to(cardRef.current, { backgroundColor: '', duration: 0.5, clearProps: 'backgroundColor' })
                .fromTo(cardRef.current, { scale: 0.98 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" }, "-=0.4");
        }
        setWasScanning(isScanning);
    }, [isScanning]);

    return (
        <div
            ref={cardRef}
            onClick={() => !isScanning && loadFile(file)}
            className={`group border rounded-xl p-0 transition-all duration-300 h-56 flex flex-col relative overflow-hidden fade-in-item opacity-0
                ${isScanning
                    ? 'bg-slate-50 dark:bg-slate-900 border-blue-500/30 shadow-md dark:shadow-[0_0_15px_rgba(59,130,246,0.1)] cursor-wait'
                    : 'bg-tip-surface border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-2xl hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:-translate-y-1.5'
                }`}
        >
            {/* Header / Preview Section */}
            <div className={`flex-1 relative p-4 overflow-hidden border-b transition-colors
                ${isScanning
                    ? 'bg-slate-100/50 dark:bg-slate-950/50 border-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/50'
                }`}>

                {/* Tech Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#0055ff 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>

                {/* Active Scan Line Animation - Visible/Intense mainly when Scanning */}
                {isScanning && (
                    <div className="absolute inset-x-0 h-[2px] bg-blue-500 shadow-[0_0_10px_#3b82f6] blur-[2px] top-0 animate-scanline pointer-events-none z-10"></div>
                )}


                {/* Card Top Actions (Hide when scanning) */}
                {!isScanning && (
                    <div className="absolute top-0 right-0 p-3 z-50" onClick={(e) => e.stopPropagation()}>
                        <div
                            onClick={(e) => toggleMenu(e, file.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                        >
                            <Icons.MoreHorizontal size={18} />
                        </div>

                        {openMenuId === file.id && (
                            <div
                                id={`menu-${file.id}`}
                                className="absolute right-0 top-10 w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); alert("Comparison Mode coming soon"); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                >
                                    <Icons.RefreshCw size={14} className="opacity-70" /> I-upload Ulit
                                </button>
                                <div className="h-[1px] bg-slate-100 dark:bg-slate-800"></div>
                                <button
                                    onClick={(e) => handleDeleteClick(e, file.id)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors"
                                >
                                    <Icons.Trash2 size={14} className="opacity-70" /> I-delete
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Central Visualization */}
                <div className="relative flex flex-col items-center justify-center h-full gap-3 py-2">
                    <div className={`w-12 h-16 border rounded-sm shadow-md flex items-center justify-center relative transition-transform duration-500
                        ${isScanning
                            ? 'bg-white dark:bg-slate-900 border-blue-500/50 text-blue-600 dark:text-blue-400 animate-pulse'
                            : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                        }`}>

                        {/* Render Lottie if Scanning, else File Text */}
                        {isScanning ? (
                            <div className="w-20 h-20 -my-2 flex items-center justify-center">
                                <DotLottieReact
                                    src="https://lottie.host/8908b664-402b-4f65-ab5f-122e42a0eaff/lJD6OSQpKY.lottie"
                                    loop
                                    autoplay
                                    className="w-full h-full"
                                />
                            </div>
                        ) : (
                            <Icons.FileText size={24} strokeWidth={1.5} />
                        )}


                        {/* HUD Badge - Only for Analyzed - Matches Screenshot Style */}
                        {!isScanning && (
                            <div className="absolute -bottom-2 -right-3 w-8 h-8 bg-slate-900 dark:bg-slate-950/80 backdrop-blur-sm border border-slate-700 rounded-full flex items-center justify-center shadow-lg z-10">
                                <span className={`text-[9px] font-bold ${confidenceScore > 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                                    {confidenceScore}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tech Lines or Loading Bar */}
                    <div className={`w-32 space-y-2 transition-opacity ${isScanning ? 'opacity-100' : 'opacity-[0.15] dark:opacity-[0.25]'}`}>
                        {isScanning ? (
                            <div className="h-1 bg-blue-500/30 rounded-full w-full overflow-hidden relative shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                <div className="h-full bg-blue-400 animate-progress-loading w-1/2 rounded-full absolute top-0 left-0 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                            </div>
                        ) : (
                            <>
                                <div className="h-1 bg-slate-400 dark:bg-slate-500 rounded-full w-full"></div>
                                <div className="h-1 bg-slate-400 dark:bg-slate-500 rounded-full w-2/3"></div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Information Section */}
            <div className={`px-5 py-4 transition-colors ${isScanning ? 'bg-slate-50/80 dark:bg-slate-900/50' : 'bg-tip-surface'}`}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className={`font-bold text-sm truncate transition-colors leading-tight ${isScanning ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-tip-text-main'}`}>
                            {file.title || "Untitled Analysis"}
                        </h4>
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] border rounded-sm px-1 leading-none py-0.5 h-fit whitespace-nowrap
                            ${isScanning
                                ? 'text-blue-600 dark:text-blue-400 border-blue-600/20 dark:border-blue-400/20 animate-pulse'
                                : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                            {isScanning ? 'SCANNING' : 'ANALYSIS'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 h-3">
                        {isScanning ? (
                            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 animate-typing-loop inline-block w-fit">
                                Scanning in Progress...
                            </span>
                        ) : (
                            <>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 transition-colors italic">
                                    {file.date || "Dec 26, 2025"}
                                </p>
                                <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${confidenceScore > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${confidenceScore}%` }}
                                    ></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

const Overview = ({ files = [], setDashboardState, setActiveFile, loadFile, searchTerm, integrityAvg, totalAudits, loading }) => {
    const { deleteAnalysis } = useDashboard();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Filter files based on search term
    const filteredFiles = useMemo(() => {
        if (!Array.isArray(files)) return [];
        return files.filter(file =>
            file.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [files, searchTerm]);

    // Optimized GSAP Stagger
    useGSAP(() => {
        if (loading) return; // Wait for loading to finish
        const ctx = gsap.context(() => {
            gsap.fromTo(".fade-in-item",
                { autoAlpha: 0, y: 10 },
                { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out", delay: 0.1 }
            );
        });
        return () => ctx.revert();
    }, [files.length, loading]);

    const toggleMenu = useCallback((e, id) => {
        e.stopPropagation();
        setOpenMenuId(prev => prev === id ? null : id);
        if (openMenuId !== id) {
            setTimeout(() => {
                const el = document.getElementById(`menu-${id}`);
                if (el) gsap.fromTo(el, { opacity: 0, y: -5 }, { opacity: 1, y: 0, duration: 0.15 });
            }, 0);
        }
    }, [openMenuId]);

    const handleBackgroundClick = () => {
        if (openMenuId) setOpenMenuId(null);
    };

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

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <Loader />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-8 animate-pulse">Syncing Institutional Database</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-tip-bg transition-colors duration-300" onClick={handleBackgroundClick}>
            {/* ... rest of the component ... */}

            {deleteConfirmId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl max-w-sm w-full transform scale-100 transition-all">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                <Icons.Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">I-delete ang Analysis?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Hindi na ito maibabalik. Mabubura na ang lahat ng records.
                            </p>
                            <div className="flex items-center gap-3 w-full pt-2">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Kanselahin
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                                >
                                    I-delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 fade-in-item opacity-0">
                    <div className="bg-tip-surface border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-center gap-4 shadow-soft transition-colors duration-300">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                            <Icons.FileText size={20} />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-slate-900 dark:text-tip-text-main">{totalAudits || files.length}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kabuuang Reports</span>
                        </div>
                    </div>
                    <div className="bg-tip-surface border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-center gap-4 shadow-soft transition-colors duration-300">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">
                            <Icons.CheckCircle size={20} />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-slate-900 dark:text-tip-text-main">{integrityAvg}%</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg. Integrity</span>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

                        <div
                            onClick={() => setDashboardState('UPLOAD')}
                            className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl h-56 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all fade-in-item opacity-0 hover:-translate-y-1.5"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 dark:group-hover:bg-blue-600 group-hover:text-white transition-all mb-3 shadow-inner">
                                <Icons.Plus size={24} />
                            </div>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-wider">Bagong Analysis</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
