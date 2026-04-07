import React, { useState, useCallback } from 'react';
import Icons from '../ui/Icons';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { useTheme } from '../../contexts/ThemeContext';
import { translations } from '../../utils/translations';

const Batching = () => {
    const { language } = useUI();
    const { theme } = useTheme();
    const { startBatchScan } = useActions();
    
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const t = useCallback((key) => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles) => {
        const validFiles = newFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
        setFiles(prev => [...prev, ...validFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            name: f.name,
            status: 'PENDING',
            progress: 0,
            result: null
        }))]);
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const runBatch = async () => {
        if (files.length === 0 || isProcessing) return;
        
        setIsProcessing(true);
        setProgress(0);

        for (let i = 0; i < files.length; i++) {
            const currentFile = files[i];
            setFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, status: 'PROCESSING' } : f));
            
            try {
                // Simulate processing for UI (actual logic would call startBatchScan)
                await new Promise(r => setTimeout(r, 2000));
                
                setFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, status: 'COMPLETED', progress: 100 } : f));
            } catch (error) {
                setFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, status: 'ERROR' } : f));
            }
            
            const overallProgress = Math.round(((i + 1) / files.length) * 100);
            setProgress(overallProgress);
        }
        
        setIsProcessing(false);
    };

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-700 p-8 pt-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-tip-text-main mb-2">
                    {t('nav.batching')}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Magsagawa ng maramihang pagsusuri para sa mga institusyonal na dokumento.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                
                {/* Left: Upload Area */}
                <div className="lg:col-span-1 space-y-6">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 group
                            ${isDragging 
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[0.98]' 
                                : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                            }
                        `}
                    >
                        <input
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center text-center p-6">
                            <div className={`p-4 rounded-2xl mb-4 transition-colors ${isDragging ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                <Icons.Upload size={32} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                                {isDragging ? 'Bitawan para mag-upload' : 'I-drag ang mga PDF dito'}
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                O i-click para mag-browse
                            </p>
                        </div>
                    </div>

                    {/* Batch Summary Card */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status ng Pangkat</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isProcessing ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                                {isProcessing ? 'Nagpoproseso' : 'Handa'}
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Kabuuang Files</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-tip-text-main">{files.length}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-500" 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                            
                            <button
                                onClick={runBatch}
                                disabled={isProcessing || files.length === 0}
                                className={`
                                    w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95
                                    ${(isProcessing || files.length === 0)
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                    }
                                `}
                            >
                                {isProcessing ? (
                                    <Icons.Loader size={18} className="animate-spin" />
                                ) : (
                                    <Icons.Play size={18} />
                                )}
                                <span className="text-xs font-black uppercase tracking-widest">Simulan ang Batch Audit</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: File List Area */}
                <div className="lg:col-span-2 flex flex-col bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden min-h-0">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icons.List size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Listahan ng mga Dokumento</span>
                        </div>
                        <button 
                            onClick={() => setFiles([])}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                            I-clear Lahat
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {files.length > 0 ? (
                            <div className="space-y-3">
                                {files.map((f, idx) => (
                                    <div 
                                        key={f.id} 
                                        className="group bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-blue-200 dark:hover:border-blue-900/50"
                                    >
                                        <div className={`p-2 rounded-xl ${f.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 dark:bg-slate-900/50'}`}>
                                            <Icons.FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{f.name}</h4>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                                    f.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                    f.status === 'PROCESSING' ? 'bg-blue-50 border-blue-100 text-blue-600 animate-pulse' :
                                                    'bg-slate-50 border-slate-100 text-slate-400'
                                                }`}>
                                                    {f.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${f.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${f.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 w-8">{f.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {f.status === 'COMPLETED' && (
                                                <button 
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                    title="Download Report"
                                                >
                                                    <Icons.Download size={16} />
                                                </button>
                                            )}
                                            {!isProcessing && (
                                                <button 
                                                    onClick={() => removeFile(f.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                    title="Remove"
                                                >
                                                    <Icons.Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
                                <div className="p-6 rounded-full bg-slate-50 dark:bg-slate-800/30 mb-4 border border-dashed border-slate-200 dark:border-slate-800">
                                    <Icons.Layers size={48} className="opacity-20" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Walang mga file na nakapila</h3>
                                <p className="text-xs">Magsimula sa pamamagitan ng pag-upload ng mga dokumentong PDF.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Tapos: {files.filter(f => f.status === 'COMPLETED').length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Pila: {files.filter(f => f.status === 'PENDING').length}</span>
                            </div>
                        </div>
                        {files.filter(f => f.status === 'COMPLETED').length > 0 && (
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                                <Icons.Download size={12} />
                                I-download ang lahat ng Reports (ZIP)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Batching;
