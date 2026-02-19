import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Icons from '../ui/Icons';
import { renderAsync } from 'docx-preview';
import { useTheme } from '../../contexts/ThemeContext';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';

const Results = () => {
    const docxContainerRef = useRef(null);
    const wrapperRef = useRef(null);
    const { theme } = useTheme();
    const { activeFile } = useData();
    const { focusedIssue } = useUI();
    const { setFocusedIssue } = useActions();

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

            {/* DRAGGABLE AUDIT GUIDANCE (Floating Lens) */}
            {focusedIssue && (
                <div
                    className="fixed z-[200] rounded-2xl overflow-hidden transition-all duration-500 animate-in zoom-in-95 pointer-events-auto"
                    style={{
                        left: `${windowPos.x}px`,
                        top: `${windowPos.y}px`,
                        width: '320px',
                        cursor: isDragging ? 'grabbing' : 'auto',
                    }}
                >
                    <div className="glass-panel border-indigo-500/40 shadow-premium backdrop-blur-2xl">
                        <div
                            className="bg-indigo-500/10 px-5 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-white/5"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="flex items-center gap-2">
                                <Icons.Zap size={10} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Institutional Lens</span>
                            </div>
                            <button onClick={() => setFocusedIssue(null)} className="text-slate-500 hover:text-white transition-colors">
                                <Icons.X size={14} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${focusedIssue.snippet ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {focusedIssue.snippet ? 'Evidence Found' : 'Contextual Gap'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-white tracking-tight leading-tight">{focusedIssue.label}</h4>
                                {focusedIssue.suggestion ? (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-[11px] font-bold text-slate-300 leading-relaxed uppercase tracking-tight">
                                            {focusedIssue.suggestion}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-500 italic uppercase">Manual verification required.</p>
                                )}
                            </div>

                            <button
                                className="w-full py-3 glass-panel border-white/10 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all"
                                onClick={() => setFocusedIssue(null)}
                            >
                                Synchronize View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUDIT HEADER BAR */}
            <div className="glass-panel border-white/5 p-8 mb-8 flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-indigo-400 border-white/10 shrink-0">
                        <Icons.Shield size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter leading-tight line-clamp-1">{activeFile.title}</h1>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                            <span>{activeFile.date}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>NODE_ID: {activeFile.id?.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all border-white/5"
                    >
                        {isMaximized ? <Icons.Minimize size={20} /> : <Icons.Maximize size={20} />}
                    </button>
                </div>
            </div>


            {/* DOCUMENT VIEWER AREA */}
            <div ref={wrapperRef} className={`w-full relative ${isMaximized ? 'max-w-7xl mx-auto h-[calc(100vh-160px)]' : 'flex-1 flex flex-col min-h-0'}`}>
                <div className="glass-panel border-white/5 shadow-2xl overflow-hidden transition-all duration-700 flex flex-col flex-1 h-full min-h-[800px]">
                    <div className="bg-white/5 border-b border-white/5 px-8 py-5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${isDocxRendered || !isDocx ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 animate-pulse'}`} />
                                Terminal Render
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Fidelity: Institutional High</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0 flex justify-center items-start custom-scrollbar bg-tip-bg/30">
                        <div
                            className="HighFidelityContainer animate-fade-in-up origin-top relative py-8"
                            style={{
                                transform: `scale(${zoomScale})`,
                                width: '800px',
                                marginBottom: isDocx ? `${(zoomScale * 1400) - 1400}px` : '0px'
                            }}
                        >
                            {isPDF && activeFile.fileUrl ? (
                                <div className={`w-full h-[1400px] rounded-sm shadow-premium border border-white/10 overflow-hidden ${isDark ? 'invert grayscale opacity-90' : ''}`}>
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
                                            background: ${isDark ? '#0F172A' : '#FFFFFF'} !important;
                                            color: ${isDark ? '#E2E8F0' : '#0F172A'} !important;
                                            margin-bottom: 2rem !important;
                                            box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8) !important;
                                            border: 1px solid rgba(255,255,255,0.05) !important;
                                            border-radius: 4px !important;
                                            padding: 2.5cm !important;
                                            width: 100% !important;
                                            max-width: 21cm !important;
                                            min-height: 29.7cm !important;
                                            position: relative !important;
                                            font-family: 'Inter', sans-serif !important;
                                            transition: background 0.5s, color 0.5s;
                                        }
                                        .docx-render-container img {
                                            max-width: 100% !important;
                                            height: auto !important;
                                            border-radius: 8px;
                                            ${isDark ? 'filter: brightness(0.8) contrast(1.2);' : ''}
                                        }
                                        .audit-highlight {
                                            position: relative;
                                            z-index: 10;
                                            padding: 0 4px;
                                        }
                                    `}} />
                                </div>
                            ) : isImage && activeFile.fileUrl ? (
                                <div className="p-8 glass-panel border-white/10 rounded-2xl shadow-premium animate-zoom-in">
                                    <img src={activeFile.fileUrl} alt="Visual Evidence" className={`max-w-full h-auto rounded-xl shadow-2xl ${isDark ? 'filter brightness-90' : ''}`} />
                                </div>
                            ) : (
                                <div className={`w-full p-20 glass-panel border-white/10 rounded-sm shadow-premium text-lg leading-relaxed font-sans whitespace-pre-wrap break-words min-h-[1000px] transition-all duration-700 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                    {focusedIssue?.snippet ? (
                                        (() => {
                                            const text = activeFile.fullText || "";
                                            const snippet = focusedIssue.snippet.trim();
                                            const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
                                            try {
                                                const regex = new RegExp(`(${escaped})`, 'i');
                                                const parts = text.split(regex);
                                                if (parts.length > 1) {
                                                    return parts.map((part, i) => {
                                                        if (regex.test(part)) {
                                                            return <span key={i} ref={textHighlightRef} className="bg-indigo-500/30 ring-1 ring-indigo-500 border-b-2 border-indigo-500 rounded-sm px-1 shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse">{part}</span>;
                                                        }
                                                        return part;
                                                    });
                                                }
                                            } catch (e) { }
                                            return text;
                                        })()
                                    ) : (activeFile.fullText || "Initializing terminal state...")}
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
