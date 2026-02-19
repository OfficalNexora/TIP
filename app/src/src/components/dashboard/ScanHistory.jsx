import React, { useState } from 'react';
import Loader from '../ui/Loader';
import Icons from '../ui/Icons';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { normalizeConfidence, getComplianceLabel } from '../../utils/confidenceUtils';

import { useUI, useData, useActions, useScan } from '../../contexts/DashboardContext';

const ScanHistory = () => {
    const { loadingHistory } = useData();
    const { files } = useData();
    const { loadFile, loadMore } = useActions();
    const { hasMore, loadingMore } = useScan();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedFiles = [...(files || [])].sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';

        if (valA < valB) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredFiles = sortedFiles.filter(f =>
        (f.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.filename || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    useGSAP(() => {
        if (filteredFiles.length > 0 && !loadingHistory) {
            gsap.fromTo(".history-row",
                { autoAlpha: 0, y: 15 },
                { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "expo.out" }
            );
        }
    }, [filteredFiles, loadingHistory]);

    if (loadingHistory) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <Loader />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-8 animate-pulse">Syncing Institutional Archive</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-8 animate-fade-in p-8 md:px-12 md:py-10 pb-24">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Audit Archive</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Institutional Verification Records</p>
                </div>
                <div className="relative w-full md:w-80 group">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search archive keys..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass-input w-full pl-12 h-12"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="glass-panel border-white/5 rounded-2xl shadow-premium overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left table-fixed min-w-[800px]">
                        <thead className="bg-white/5 border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="w-[40%] px-8 py-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                                    <div className="flex items-center gap-2">
                                        Document Identifier
                                        {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <Icons.ArrowUp size={10} /> : <Icons.ArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="w-[20%] px-8 py-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-2">
                                        Temporal Stamp
                                        {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <Icons.ArrowUp size={10} /> : <Icons.ArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="w-[20%] px-8 py-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('confidence')}>
                                    <div className="flex items-center gap-2">
                                        Audit Integrity
                                        {sortConfig.key === 'confidence' && (sortConfig.direction === 'asc' ? <Icons.ArrowUp size={10} /> : <Icons.ArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="px-8 py-5 text-right">Terminal Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredFiles.map((file) => (
                                <tr key={file.id} className="history-row group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-indigo-400 border-white/10 group-hover:scale-110 transition-transform shrink-0">
                                                <Icons.FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-black text-white tracking-tight truncate" title={file.title}>{file.title}</div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{file.filename}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{file.date}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${normalizeConfidence(file.confidence) > 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                                                    style={{ width: `${normalizeConfidence(file.confidence)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-white">{normalizeConfidence(file.confidence)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => loadFile(file)}
                                            className="px-4 py-2 glass-panel border-white/5 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all active:scale-95"
                                        >
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredFiles.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No archive nodes found</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center pt-4">
                {hasMore ? (
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 glass-panel border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {loadingMore ? 'Syncing Archive...' : 'Load Sequential Records'}
                        {!loadingMore && <Icons.ChevronDown size={14} />}
                    </button>
                ) : (
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Terminal Boundary Reached</span>
                )}
            </div>
        </div>
    );
};

export default ScanHistory;

