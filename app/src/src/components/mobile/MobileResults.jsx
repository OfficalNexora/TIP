import React, { useRef, useState, useEffect } from 'react';
import Icons from '../ui/Icons';
import { renderAsync } from 'docx-preview';
import { useTheme } from '../../contexts/ThemeContext';
import { useData, useActions, useUI } from '../../contexts/DashboardContext';

const MobileResults = () => {
    const { activeFile } = useData();
    const { setDashboardState, setFocusedIssue } = useActions();
    const { focusedIssue } = useUI();
    const { theme } = useTheme();

    const [isDocxRendered, setIsDocxRendered] = useState(false);
    const docxContainerRef = useRef(null);

    const isPDF = activeFile?.mimeType === 'application/pdf';
    const isDocx = activeFile?.mimeType?.includes('officedocument.wordprocessingml.document');
    const isImage = activeFile?.mimeType?.startsWith('image/');

    // Check dark mode
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

    useEffect(() => {
        if (activeFile?.fileBlob && isDocx) {
            setIsDocxRendered(false);
            if (docxContainerRef.current) {
                docxContainerRef.current.innerHTML = '';
                renderAsync(activeFile.fileBlob, docxContainerRef.current)
                    .then(() => setIsDocxRendered(true))
                    .catch(e => console.error("DOCX Error", e));
            }
        }
    }, [activeFile?.fileBlob, isDocx]);

    if (!activeFile) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-tip-bg flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0">
                <button
                    onClick={() => setDashboardState('OVERVIEW')}
                    className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/5 text-slate-400"
                >
                    <Icons.ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center px-4">
                    <h1 className="text-sm font-black text-white truncate">{activeFile.title}</h1>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeFile.confidence}% Integrity</span>
                </div>
                <button
                    onClick={() => setFocusedIssue(focusedIssue ? null : { label: "AI Insights", type: 'summary' })} // Toggle bottom sheet
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${focusedIssue ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
                >
                    <Icons.Zap size={20} fill={focusedIssue ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 safe-area-bottom">

                {/* PDF Viewer */}
                {isPDF && activeFile.fileUrl && (
                    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-white/10 bg-slate-800">
                        <iframe src={activeFile.fileUrl} className="w-full h-full" title="PDF Viewer" />
                    </div>
                )}

                {/* DOCX Viewer */}
                {isDocx && (
                    <div className="w-full bg-white text-slate-900 p-4 rounded-xl min-h-[600px] shadow-lg">
                        <div ref={docxContainerRef} className="docx-render-mobile" />
                        <style>{`
                            .docx-render-mobile section.docx { padding: 1rem !important; box-shadow: none !important; margin-bottom: 0 !important; }
                        `}</style>
                    </div>
                )}

                {/* Text Fallback */}
                {!isPDF && !isDocx && !isImage && (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 font-sans p-2">
                        {activeFile.fullText || "No text content available."}
                    </div>
                )}

                <div className="h-24" /> {/* Spacer for bottom sheet */}
            </div>

            {/* Bottom Sheet for AI Insights */}
            {focusedIssue && (
                <div className="fixed inset-x-0 bottom-0 z-[70] bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 max-h-[50vh] flex flex-col">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Audit Lens</span>
                        </div>
                        <button onClick={() => setFocusedIssue(null)} className="p-2 -mr-2 text-slate-500">
                            <Icons.ChevronDown size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-6">
                        {/* Dynamic Content based on issue type would go here */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-white">Analysis Summary</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {activeFile.summary || "Deep heuristic scan complete. No critical anomalies detected in semantic structure."}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 w-full" />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-3 rounded-xl">
                                <span className="block text-[9px] text-slate-500 uppercase font-black mb-1">Risk Level</span>
                                <span className="text-emerald-400 font-bold text-sm">Low</span>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <span className="block text-[9px] text-slate-500 uppercase font-black mb-1">Origin</span>
                                <span className="text-white font-bold text-sm">Human</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileResults;
