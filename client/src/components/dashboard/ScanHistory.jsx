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
                { autoAlpha: 0, y: 10 },
                { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "power2.out" }
            );
        }
    }, [filteredFiles, loadingHistory]);

    if (loadingHistory) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <Loader />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-8 animate-pulse">Syncing Institutional Archive</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in p-8 md:p-12 pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-tip-primary tracking-tight transition-colors">Audit Archive</h1>
                    <p className="text-sm text-tip-text-muted mt-1 transition-colors">Listahan ng mga nakaraang compliance assessment</p>
                </div>
                <div className="relative w-72 group">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tip-text-muted group-focus-within:text-tip-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Maghanap ng record..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-tip-surface border border-tip-border rounded-md py-2 pl-10 pr-4 text-xs text-tip-text-main focus:outline-none focus:border-tip-primary focus:ring-1 focus:ring-tip-primary/20 transition-all font-sans"
                    />
                </div>
            </div>

            <div className="bg-tip-surface border border-tip-border rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-hidden">
                    <table className="w-full text-left text-xs text-tip-text-main table-fixed">
                        <thead className="bg-[#002147] text-white uppercase font-bold tracking-[0.1em] transition-colors border-b border-tip-primary">
                            <tr>
                                <th className="w-[40%] px-6 py-4 cursor-pointer hover:bg-[#003366] transition-colors" onClick={() => handleSort('title')}>
                                    <div className="flex items-center gap-2">
                                        Pangalan ng Dokumento
                                        {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <Icons.ArrowUp size={12} /> : <Icons.ArrowDown size={12} />)}
                                    </div>
                                </th>
                                <th className="w-[18%] px-6 py-4 cursor-pointer hover:bg-[#003366] transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-2">
                                        Petsa ng Verification
                                        {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <Icons.ArrowUp size={12} /> : <Icons.ArrowDown size={12} />)}
                                    </div>
                                </th>
                                <th className="w-[15%] px-6 py-4 cursor-pointer hover:bg-[#003366] transition-colors" onClick={() => handleSort('confidence')}>
                                    <div className="flex items-center gap-2">
                                        Integrity
                                        {sortConfig.key === 'confidence' && (sortConfig.direction === 'asc' ? <Icons.ArrowUp size={12} /> : <Icons.ArrowDown size={12} />)}
                                    </div>
                                </th>
                                <th className="w-[17%] px-6 py-4">Assessment</th>
                                <th className="w-[10%] px-6 py-4 text-right">Records</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-tip-border">
                            {filteredFiles.map((file) => (
                                <tr key={file.id} className="history-row hover:bg-tip-bg/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium flex items-center gap-3 min-w-0">
                                        <div className="flex-shrink-0 p-2 bg-tip-primary/5 text-tip-primary border border-tip-primary/10 rounded-md transition-colors">
                                            <Icons.FileText size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate transition-colors font-bold text-tip-primary" title={file.title}>{file.title}</div>
                                            <div className="text-[10px] text-tip-text-muted font-mono truncate transition-colors">{file.filename}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-tip-text-secondary">
                                        {file.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1.5 bg-tip-bg border border-tip-border/10 rounded-full overflow-hidden transition-colors">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${normalizeConfidence(file.confidence) > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${normalizeConfidence(file.confidence)}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-tip-text-main transition-colors">{normalizeConfidence(file.confidence)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${normalizeConfidence(file.confidence) > 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                                            {normalizeConfidence(file.confidence) > 70 ? <Icons.CheckCircle size={10} /> : <Icons.AlertCircle size={10} />}
                                            {getComplianceLabel(file.confidence)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => loadFile(file)}
                                            className="btn-institutional px-4 py-1.5 text-[10px] shadow-sm transform translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Tingnan ang Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredFiles.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-tip-text-muted italic">
                                        Walang nakitang records na tumutugma sa search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="py-4 flex justify-center pb-8">
                {hasMore ? (
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white dark:bg-tip-bg border border-tip-border rounded-full text-xs font-bold text-tip-text-main shadow-sm hover:shadow-md hover:border-tip-primary/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingMore ? <Loader size={12} /> : <Icons.ChevronDown size={14} />}
                        {loadingMore ? 'Syncing...' : 'Load More Records'}
                    </button>
                ) : (
                    <p className="text-[10px] text-tip-text-muted italic">End of institutional records</p>
                )}
            </div>

        </div>
    );
};

export default ScanHistory;
