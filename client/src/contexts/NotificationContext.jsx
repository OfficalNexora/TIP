import React, { createContext, useContext, useState, useCallback } from 'react';
import Icons from '../components/ui/Icons';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Helper functions for common types
    const notify = {
        success: (title, message) => addToast({ type: 'success', title, message }),
        error: (title, message) => addToast({ type: 'error', title, message }),
        info: (title, message) => addToast({ type: 'info', title, message }),
        warning: (title, message) => addToast({ type: 'warning', title, message }),
    };

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <div className="fixed top-24 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto min-w-[320px] max-w-sm rounded-xl p-4 shadow-2xl border backdrop-blur-md animate-slide-in-right transition-all
                            ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-white' : ''}
                            ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-white' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-white' : ''}
                            ${toast.type === 'info' ? 'bg-slate-900/90 border-blue-500/30 text-white' : ''}
                        `}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0 border
                                ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''}
                                ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : ''}
                                ${toast.type === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : ''}
                                ${toast.type === 'info' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : ''}
                            `}>
                                {toast.type === 'error' && <Icons.AlertCircle size={18} />}
                                {toast.type === 'success' && <Icons.Check size={18} />}
                                {toast.type === 'warning' && <Icons.Alert size={18} />}
                                {toast.type === 'info' && <Icons.Info size={18} />}
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h4 className="font-bold text-sm mb-1">{toast.title}</h4>
                                <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <Icons.X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
