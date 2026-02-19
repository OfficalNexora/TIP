import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationContext';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queue, setQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const notify = useNotification();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            notify.success("Connection Restored");
            processQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            notify.error("Offline Mode Activated");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [notify]);

    // Load queue from localStorage on mount
    useEffect(() => {
        const savedQueue = localStorage.getItem('offlineQueue');
        if (savedQueue) {
            try {
                setQueue(JSON.parse(savedQueue));
            } catch (e) {
                console.error("Failed to parse offline queue", e);
            }
        }
    }, []);

    // Save queue to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('offlineQueue', JSON.stringify(queue));
    }, [queue]);

    // AXIOS INTERCEPTOR: The "Connectivity" Layer
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                    const config = error.config;
                    // Only queue mutation requests (POST, PUT, DELETE)
                    if (config.method !== 'get') {
                        const offlineAction = {
                            id: Date.now(),
                            url: config.url,
                            method: config.method,
                            data: config.data,
                            headers: config.headers,
                            timestamp: new Date().toISOString()
                        };
                        setQueue(prev => [...prev, offlineAction]);
                        notify.info("Request queued for sync");
                        return Promise.resolve({ data: { offline: true, message: "Action queued" } });
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, [notify]);

    const addToQueue = useCallback((action) => {
        setQueue(prev => [...prev, action]);
        notify.info("Action saved to Outbox (Offline)");
    }, [notify]);

    const processQueue = useCallback(async () => {
        const savedQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        if (savedQueue.length === 0) return;

        setIsSyncing(true);
        notify.info(`Syncing ${savedQueue.length} pending actions...`);

        const remainingQueue = [];

        for (const action of savedQueue) {
            try {
                await axios({
                    url: action.url,
                    method: action.method,
                    data: action.data,
                    headers: action.headers
                });
            } catch (err) {
                console.error("Sync failed for action", action.id, err);
                // If it's a 4xx error, don't retry (logic error). If 5xx or network, keep it.
                if (!err.response || err.response.status >= 500) {
                    remainingQueue.push(action);
                }
            }
        }

        setQueue(remainingQueue);
        setIsSyncing(false);

        if (remainingQueue.length === 0) {
            notify.success("All offline data synced successfully");
        } else {
            notify.warning(`${remainingQueue.length} actions failed to sync`);
        }

    }, [notify]);

    return (
        <OfflineContext.Provider value={{ isOnline, queue, addToQueue, isSyncing }}>
            {children}

            {/* Offline Indicators */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-[10px] font-bold text-center py-1 z-[100] uppercase tracking-widest shadow-lg animate-in slide-in-from-top">
                    Offline Mode &bull; {queue.length} Pending
                </div>
            )}

            {isSyncing && (
                <div className="fixed top-0 left-0 right-0 bg-indigo-500 text-white text-[10px] font-bold text-center py-1 z-[100] uppercase tracking-widest shadow-lg animate-pulse">
                    Syncing Data...
                </div>
            )}
        </OfflineContext.Provider>
    );
};
