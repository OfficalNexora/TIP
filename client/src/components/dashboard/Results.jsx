import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Icons from '../ui/Icons';
import { renderAsync } from 'docx-preview';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboard } from '../../contexts/DashboardContext';

const Results = ({ activeFile }) => {
    const docxContainerRef = useRef(null);
    const wrapperRef = useRef(null);
    const { theme } = useTheme();
    const { focusedIssue, setFocusedIssue } = useDashboard();

    const [isDocxRendered, setIsDocxRendered] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);
    const [highlightRect, setHighlightRect] = useState(null);

    const isPDF = activeFile?.mimeType === 'application/pdf';
    const isDocx = activeFile?.mimeType?.includes('officedocument.wordprocessingml.document');
    const isImage = activeFile?.mimeType?.startsWith('image/');

    // DRAGGABLE WINDOW STATE
    const [windowPos, setWindowPos] = useState({ x: -1000, y: -1000 }); // Start off-screen
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Center the window initially when focusedIssue changes
    useLayoutEffect(() => {
        if (focusedIssue) {
            const width = 320;
            const height = 280; // Approximate height with header

            // DYNAMIC BOUNDARY DETECTION
            const sidebar = document.querySelector('nav') || { offsetWidth: 280 };
            const header = document.querySelector('header') || { offsetHeight: 80 };

            const sidebarWidth = sidebar.offsetWidth || 280;
            const headerHeight = header.offsetHeight || 80;

            // Center in the AVAILABLE main area
            const availableWidth = window.innerWidth - sidebarWidth;
            const availableHeight = window.innerHeight - headerHeight;

            const startX = sidebarWidth + (availableWidth / 2) - (width / 2);
            const startY = headerHeight + (availableHeight / 2) - (height / 2);

            setWindowPos({ x: startX, y: startY });
        }
    }, [!!focusedIssue]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - windowPos.x,
            y: e.clientY - windowPos.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            let nextX = e.clientX - dragOffset.x;
            let nextY = e.clientY - dragOffset.y;

            // DYNAMIC BOUNDARY CONSTRAINTS
            const sidebar = document.querySelector('nav') || { offsetWidth: 280 };
            const header = document.querySelector('header') || { offsetHeight: 80 };

            const sidebarWidth = sidebar.offsetWidth || 280;
            const headerHeight = header.offsetHeight || 80;
            const windowWidth = 320;
            const windowHeight = 250; // Approximate

            // Constraint logic: Keep strictly within main panel
            if (nextX < sidebarWidth) nextX = sidebarWidth;
            if (nextX > window.innerWidth - windowWidth) nextX = window.innerWidth - windowWidth;
            if (nextY < headerHeight) nextY = headerHeight;
            if (nextY > window.innerHeight - windowHeight) nextY = window.innerHeight - windowHeight;

            setWindowPos({ x: nextX, y: nextY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Dynamic Zoom-to-Fit Calculation
    useEffect(() => {
        const calculateScale = () => {
            if (!wrapperRef.current) return;
            const containerWidth = wrapperRef.current.offsetWidth;
            const targetWidth = 800;
            const newScale = containerWidth / targetWidth;
            setZoomScale(newScale);
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
            if (docxContainerRef.current) {
                docxContainerRef.current.innerHTML = '';
                renderAsync(activeFile.fileBlob, docxContainerRef.current)
                    .then(() => {
                        console.log("[Viewer] DOCX Rendered successfully.");
                        setIsDocxRendered(true);
                    })
                    .catch(err => console.error("[Viewer] DOCX Render Error:", err));
            }
        }
    }, [activeFile?.fileBlob, activeFile?.mimeType]);

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

    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

    return (
        <div className={`w-full flex flex-col animate-fade-in ${isMaximized ? 'fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 p-6 overflow-auto' : ''}`}>

            {/* DRAGGABLE AUDIT WINDOW (Floating Camera View) */}
            {focusedIssue && (
                <div
                    className="fixed z-[200] shadow-2xl rounded-2xl overflow-hidden transition-shadow duration-300 pointer-events-auto"
                    style={{
                        left: `${windowPos.x}px`,
                        top: `${windowPos.y}px`,
                        width: '320px',
                        cursor: isDragging ? 'grabbing' : 'auto',
                        boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none'
                    }}
                >
                    <div className="bg-white dark:bg-slate-900 border-2 border-tip-primary dark:border-blue-500 shadow-2xl rounded-2xl overflow-hidden">
                        <div
                            className="bg-tip-primary dark:bg-blue-600 px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
                            onMouseDown={handleMouseDown}
                        >
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Revision Guidance</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setFocusedIssue(null)} className="text-white hover:bg-white/20 p-1 rounded transition-colors">
                                    <Icons.X size={12} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 mb-3">
                                {focusedIssue.snippet ? (
                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-100 dark:border-blue-800">
                                        Institutional Evidence Found
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-100 dark:border-slate-700">
                                        Procedural Gap Detected
                                    </span>
                                )}
                            </div>

                            {focusedIssue.suggestion ? (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                    <h4 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">Institutional Suggestion</h4>
                                    <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                        {focusedIssue.suggestion}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic">No specific suggestion available.</p>
                            )}
                            <div className="flex justify-end pt-2">
                                <button
                                    className="text-[10px] font-bold text-tip-primary dark:text-blue-400 uppercase tracking-wider"
                                    onClick={() => setFocusedIssue(null)}
                                >
                                    I understand
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden transition-all duration-500 flex flex-col flex-1 h-full min-h-[800px]">
                    <div className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between transition-colors shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isDocxRendered || !isDocx ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                                Institusyonal na Pagsusuri
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0 flex justify-center items-start custom-scrollbar bg-slate-100 dark:bg-slate-950 transition-colors duration-500">
                        <div
                            className="HighFidelityContainer animate-fade-in-up origin-top relative"
                            style={{
                                transform: `scale(${zoomScale})`,
                                width: '800px',
                                marginBottom: isDocx ? `${(zoomScale * 1400) - 1400}px` : '0px'
                            }}
                        >
                            {isPDF && activeFile.fileUrl ? (
                                <div className={`w-full h-[1400px] rounded shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${isDark ? 'invert grayscale opacity-80' : ''}`}>
                                    <embed src={activeFile.fileUrl} type="application/pdf" className="w-full h-full" />
                                </div>
                            ) : isDocx ? (
                                <div className="docx-wrapper w-full flex flex-col items-center">
                                    <div
                                        ref={docxContainerRef}
                                        className="docx-render-container w-full bg-transparent p-0 flex flex-col items-center"
                                    />
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                        .docx-render-container section.docx {
                                            background: ${isDark ? '#1e293b' : 'white'} !important;
                                            color: ${isDark ? '#cbd5e1' : 'black'} !important;
                                            margin-bottom: 2rem !important;
                                            box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5) !important;
                                            border-radius: 2px !important;
                                            padding: 2.5cm !important;
                                            width: 100% !important;
                                            max-width: 21cm !important;
                                            min-height: 29.7cm !important;
                                            position: relative !important;
                                            font-family: 'Times New Roman', serif !important;
                                            transition: background 0.3s, color 0.3s;
                                        }
                                        .docx-render-container img {
                                            max-width: 100% !important;
                                            height: auto !important;
                                            border-radius: 2px;
                                            ${isDark ? 'filter: brightness(0.8) contrast(1.2);' : ''}
                                        }
                                        /* Highlighting styles */
                                        .audit-highlight {
                                            position: relative;
                                            z-index: 10;
                                        }
                                    `}} />
                                </div>
                            ) : isImage && activeFile.fileUrl ? (
                                <div className={`p-4 sm:p-8 rounded shadow-2xl border border-slate-200 dark:border-slate-800 flex justify-center animate-zoom-in ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
                                    <img src={activeFile.fileUrl} alt="Ebidensya ng Dokumento" className={`max-w-full h-auto rounded shadow-lg ${isDark ? 'filter brightness-90' : ''}`} />
                                </div>
                            ) : (
                                <div className={`w-full p-8 sm:p-20 shadow-2xl rounded border text-lg leading-relaxed font-serif whitespace-pre-wrap break-words min-h-[1000px] transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-800'}`}>
                                    {focusedIssue?.snippet ? (
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
                                    ) : (activeFile.fullText || "Kasalukuyang ini-index ang nilalaman...")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;
