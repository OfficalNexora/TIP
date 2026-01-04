import React, { useState } from 'react';
import Icons from '../ui/Icons';

const Upload = ({ onStartScan }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onStartScan(e.target.files[0]);
        }
    };

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onStartScan(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="h-full flex items-center justify-center animate-fade-in px-8">
            <div className="w-full max-w-4xl space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-3">
                    <h1 className="text-5xl font-bold text-[#002147] dark:text-white tracking-tight">
                        Audit ng Dokumento
                    </h1>
                    <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        I-submit ang mga dokumento para sa evaluation gamit ang{' '}
                        <span className="text-[#002147] dark:text-blue-400 font-semibold">AI ETHICS</span>
                    </p>
                </div>

                {/* Upload Area */}
                <div
                    className={`
                        relative flex flex-col items-center justify-center w-full h-[360px]
                        rounded-xl border-2 border-dashed transition-all duration-300
                        ${isDragging
                            ? 'border-[#D4AF37] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 scale-[1.02]'
                            : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 hover:border-[#002147] dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                        cursor-pointer group backdrop-blur-sm
                    `}
                    onClick={() => document.getElementById('uploadInput').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input id="uploadInput" type="file" className="hidden" onChange={handleFileChange} />

                    {/* Upload Icon */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#002147]/10 to-[#002147]/5 dark:from-blue-500/20 dark:to-blue-500/5 flex items-center justify-center mb-6 border border-[#002147]/10 dark:border-blue-500/20 group-hover:border-[#002147]/30 dark:group-hover:border-blue-500/40 transition-all group-hover:scale-110">
                        <Icons.Upload size={36} className="text-[#002147] dark:text-blue-400 group-hover:text-[#D4AF37] dark:group-hover:text-[#D4AF37] transition-colors" />
                    </div>

                    {/* Upload Text */}
                    <div className="space-y-3 text-center">
                        <h3 className="text-2xl font-bold text-[#002147] dark:text-white">
                            I-pasa ang Dokumento para sa Verification
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                            I-drag and drop ang iyong file dito, o mag-click para mag-browse.
                        </p>
                    </div>

                    {/* Supported Formats Badge */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                        <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            PDF, DOC, DOCX
                        </span>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                            Processing Mode
                        </span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-sm font-bold text-[#002147] dark:text-blue-400 uppercase tracking-wide">
                        Institutional Worker
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Upload;
