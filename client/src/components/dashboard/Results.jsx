import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Icons from '../ui/Icons';
import { renderAsync } from 'docx-preview';
import { useTheme } from '../../contexts/ThemeContext';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { useTranslation } from '../../utils/useTranslation';
import './DocumentViewer.css';

const Results = React.memo(() => {
    const docxContainerRef = useRef(null);
    const wrapperRef = useRef(null);
    const { theme } = useTheme();
    const { activeFile } = useData();
    const { focusedIssue } = useUI();
    const { setFocusedIssue } = useActions();
    const { t } = useTranslation();

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [isDocxRendered, setIsDocxRendered] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);
    const [highlightRect, setHighlightRect] = useState(null);
    const [isScanning, setIsScanning] = useState(false); // Forensic scan animation state

    const isPDF = activeFile?.mimeType === 'application/pdf';
    const isDocx = activeFile?.mimeType?.includes('officedocument.wordprocessingml.document');
    const isLegacyDoc = activeFile?.mimeType === 'application/msword';
    const isImage = activeFile?.mimeType?.startsWith('image/');

    // DRAGGABLE WINDOW STATE REMOVED - User requested only auto-scroll

    // Dynamic Zoom-to-Fit Calculation
    useEffect(() => {
        const calculateScale = () => {
            if (!wrapperRef.current) return;
            const containerWidth = wrapperRef.current.offsetWidth - 48; // Account for padding
            const containerHeight = wrapperRef.current.offsetHeight - 48;

            // Standard A4 aspect ratio or document width
            const targetWidth = isDocx ? 794 : 800; // 794px is roughly 21cm at 96dpi

            const scaleW = containerWidth / targetWidth;

            // We want to fit at least the width, but also be mindful of height in maximized mode
            setZoomScale(Math.min(scaleW, 1.2)); // Cap at 1.2x for quality
        };

        const timer = setTimeout(calculateScale, 100);
        const observer = new ResizeObserver(calculateScale);
        if (wrapperRef.current) observer.observe(wrapperRef.current);
        window.addEventListener('resize', calculateScale);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('resize', calculateScale);
        };
    }, [isMaximized, isDocxRendered, activeFile?.id]);

    useEffect(() => {
        if (isMaximized) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isMaximized]);

    useEffect(() => {
        // Clear and Re-render DOCX when file changes
        if (activeFile?.fileBlob && activeFile.mimeType?.includes('officedocument.wordprocessingml.document')) {
            setIsDocxRendered(false);
            setHighlightRect(null);
            setIsScanning(true); // Trigger forensic scan

            if (docxContainerRef.current) {
                docxContainerRef.current.innerHTML = '';
                renderAsync(activeFile.fileBlob, docxContainerRef.current)
                    .then(() => {
                        console.log("[Viewer] DOCX Rendered successfully.");
                        setIsDocxRendered(true);
                        setTimeout(() => setIsScanning(false), 2500); // End scan after anim
                    })
                    .catch(err => {
                        console.error("[Viewer] DOCX Render Error:", err);
                        setIsScanning(false);
                    });
            }
        } else if (activeFile) {
            // Trigger scan for other formats too
            setIsScanning(true);
            setTimeout(() => setIsScanning(false), 2000);
        }
    }, [activeFile?.fileBlob, activeFile?.mimeType, activeFile?.id]);

    // INTERACTIVE AUDIT: Finding and Highlighting Snippets
    const textHighlightRef = useRef(null);
    const docxIndexRef = useRef({ fullText: "", nodeOffsets: [] });

    // 1. INDEXING (Heavy Op - Run Once per Doc Load)
    useEffect(() => {
        if (!isDocxRendered || !docxContainerRef.current) return;

        const container = docxContainerRef.current;
        let indexTimer;

        const indexDoc = () => {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            let fullText = "";
            const nodeOffsets = [];
            let currentNode;

            while (currentNode = walker.nextNode()) {
                nodeOffsets.push({
                    node: currentNode,
                    start: fullText.length,
                    end: fullText.length + currentNode.nodeValue.length
                });
                fullText += currentNode.nodeValue;
            }

            if (fullText.length > 0) {
                docxIndexRef.current = { fullText, nodeOffsets };
                console.log("[Viewer] DOCX Indexing Complete. Length:", fullText.length);
            }
        };

        // MutationObserver to detect when docx-preview actually inserts content
        const observer = new MutationObserver((mutations) => {
            clearTimeout(indexTimer);
            indexTimer = setTimeout(indexDoc, 1000); // Debounce: Wait 1s after last DOM update
        });

        observer.observe(container, { childList: true, subtree: true, characterData: true });

        return () => {
            observer.disconnect();
            clearTimeout(indexTimer);
        };
    }, [isDocxRendered, activeFile?.id]);

    // Scroll plain text highlights into view
    useEffect(() => {
        if (!isDocx && textHighlightRef.current) {
            setTimeout(() => {
                if (textHighlightRef.current) {
                    textHighlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [focusedIssue?.snippet, isDocx]);

    // 2. HIGHLIGHTING (Light Op - Run on Click)
    useEffect(() => {
        if (!focusedIssue?.snippet || !isDocxRendered) {
            setHighlightRect(null);
            return;
        }

        const findAndHighlight = () => {
            const container = docxContainerRef.current;
            if (!container) return;

            // Cleanup OLD highlights
            const oldHighlights = container.querySelectorAll('.audit-highlight');
            oldHighlights.forEach(el => {
                const parent = el.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(el.innerText), el);
                    parent.normalize();
                }
            });

            const snippet = focusedIssue.snippet.trim();
            if (!snippet) return;

            // Use CACHED Index
            const { fullText, nodeOffsets } = docxIndexRef.current;
            if (!fullText) return;

            const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
            const fuzzyRegex = new RegExp(escaped, 'i');
            const match = fullText.match(fuzzyRegex);

            if (match) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;
                const range = document.createRange();

                const startInfo = nodeOffsets.find(info => matchStart >= info.start && matchStart < info.end);
                const endInfo = nodeOffsets.find(info => matchEnd >= info.start && matchEnd <= info.end);

                if (startInfo && endInfo) {
                    try {
                        range.setStart(startInfo.node, matchStart - startInfo.start);
                        range.setEnd(endInfo.node, matchEnd - endInfo.start);

                        const contents = range.extractContents();
                        const span = document.createElement('span');
                        span.className = 'audit-highlight bg-blue-400/40 ring-2 ring-blue-500/50 rounded-sm transition-all duration-700 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse inline-block';
                        span.appendChild(contents);
                        range.insertNode(span);

                        setTimeout(() => {
                            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 50); // Reduced delay for snappier feel
                    } catch (e) {
                        console.warn("[Highlight] Complex range error:", e);
                    }
                }
            } else {
                console.warn("[Viewer] Snippet not found in index:", snippet.substring(0, 30));
            }
        };

        // Instant execution, no delay needed since indexing is pre-computed
        requestAnimationFrame(findAndHighlight);
    }, [focusedIssue, isDocxRendered, isDocx]);

    if (!activeFile) return null;

    if (activeFile.isFileLoading) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <Icons.Cpu className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                    {t('results.linking') || 'Linking to Institution...'}
                </p>
            </div>
        );
    }

    return (
        <div className={`w-full flex flex-col animate-fade-in ${isMaximized ? 'fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 p-6 overflow-auto' : ''}`}>

            {/* DRAGGABLE AUDIT WINDOW REMOVED */}

            {/* AUDIT HEADER BAR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-6 flex items-start sm:items-center justify-between shadow-sm transition-colors gap-6 overflow-hidden">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
                        <Icons.Shield size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-2 break-words" title={activeFile.title}>{activeFile.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            <span>{activeFile.date}</span>
                            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                            <span>Audit_ID: {activeFile.id?.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm"
                        title={isMaximized ? "Exit Fullscreen" : "Fullscreen View"}
                    >
                        {isMaximized ? <Icons.Minimize size={18} /> : <Icons.Maximize size={18} />}
                    </button>
                </div>
            </div>

            {/* DOCUMENT VIEWER AREA */}
            <div ref={wrapperRef} className={`w-full relative ${isMaximized ? 'max-w-7xl mx-auto h-[calc(100vh-160px)]' : 'flex-1 flex flex-col min-h-0'}`}>
                <div
                    className="border shadow-2xl overflow-hidden transition-all duration-500 flex flex-col flex-1 h-full min-h-[800px]"
                    style={{
                        backgroundColor: isDark ? '#0f172a' : 'white',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                        borderRadius: '0.5rem'
                    }}
                >
                    <div
                        className="border-b px-6 py-4 flex items-center justify-between transition-colors shrink-0"
                        style={{
                            backgroundColor: isDark ? '#020617' : '#f8fafc',
                            borderColor: isDark ? '#1e293b' : '#e2e8f0'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isDocxRendered || isImage || isPDF ? 'bg-emerald-500' : (isLegacyDoc ? 'bg-amber-500' : 'bg-blue-500 animate-pulse')}`} />
                                {t('results.institutionalAnalysis') || 'Institutional Analysis'}
                            </span>
                        </div>
                    </div>

                    <div
                        className="flex-1 overflow-auto p-0 flex justify-center items-start custom-scrollbar transition-colors duration-500 relative"
                        style={{ backgroundColor: isDark ? '#020617' : '#f1f5f9' }}
                    >
                        {/* FORENSIC SCANNING LINE */}
                        {isScanning && (
                            <div className="absolute inset-x-0 top-0 z-[150] pointer-events-none animate-scan-line">
                                <div className="h-[2px] bg-blue-500 opacity-60 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                            </div>
                        )}

                        {/* We use a wrapper to handle the exact scaled height to prevent overflow bugs */}
                        <div className="w-full flex justify-center" style={{ 
                            height: isDocx ? `calc(${zoomScale} * 100%)` : 'auto', 
                            minHeight: isDocx ? `${Math.max(1400 * zoomScale, 800)}px` : 'auto' 
                        }}>
                            <div
                                className="HighFidelityContainer animate-fade-in-up relative"
                                style={{
                                    transform: `scale(${zoomScale})`,
                                    transformOrigin: 'top center',
                                    width: isDocx ? '794px' : '800px',
                                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                            {isPDF && activeFile.fileUrl ? (
                                <div className={`w-full h-[1400px] rounded shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${isDark ? 'invert grayscale opacity-80' : ''}`}>
                                    <embed src={activeFile.fileUrl} type="application/pdf" className="w-full h-full" />
                                </div>
                            ) : isDocx ? (
                                <div className="docx-wrapper">
                                    <div
                                        ref={docxContainerRef}
                                        className="docx-render-container"
                                    />
                                </div>
                            ) : isImage && activeFile.fileUrl ? (
                                <div className="w-full h-auto rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 p-8">
                                    <img src={activeFile.fileUrl} alt={activeFile.title} className="w-full h-auto object-contain" />
                                </div>
                            ) : (
                                <div className="w-full rounded-xl p-12 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl min-h-[1000px] whitespace-pre-wrap relative">
                                    {isLegacyDoc && (
                                        <div className="absolute top-4 right-4 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded text-xs font-bold border border-amber-200 dark:border-amber-800/50">
                                            Legacy .doc Text Mode
                                        </div>
                                    )}
                                    {isDocx && !isDocxRendered ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                                            <Icons.Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('results.rendering') || 'Rendering Institutional Context...'}</span>
                                        </div>
                                    ) : focusedIssue?.snippet ? (
                                        (() => {
                                            const text = activeFile.fullText || "";
                                            const snippet = focusedIssue.snippet.trim();
                                            // Create a fuzzy regex that ignores whitespace differences
                                            const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
                                            try {
                                                const regex = new RegExp(`(${escaped})`, 'i');
                                                const parts = text.split(regex);
                                                if (parts.length > 1) {
                                                    return parts.map((part, i) => {
                                                        if (regex.test(part)) {
                                                            return <span key={i} ref={textHighlightRef} className="bg-blue-400/40 ring-2 ring-blue-500/50 rounded-sm p-0.5 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse">{part}</span>;
                                                        }
                                                        return part;
                                                    });
                                                }
                                            } catch (e) { }
                                            return text;
                                        })()
                                    ) : (activeFile.fullText || t('results.indexing') || "Currently indexing content...")}
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Results;
