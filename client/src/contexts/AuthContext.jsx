import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import axios from 'axios';

const AuthContext = createContext();

// Global lock to survive re-mounts
const globalLock = {
    profile: { token: null, time: 0 },
    ip: { time: 0 }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publicIp, setPublicIp] = useState(null);
    const sessionTokenRef = useRef(null);
    const lastProfileFetchRef = useRef({ token: null, time: 0 });

    const fetchPublicIP = async () => {
        try {
            const res = await axios.get('https://api64.ipify.org?format=json');
            setPublicIp(res.data.ip);
            return res.data.ip;
        } catch (e) {
            return null;
        }
    };

    const logSecurityEvent = useCallback(async (eventType, status = 'SUCCESS', currentSession = null) => {
        const activeSession = currentSession || session;
        if (!activeSession?.access_token) return;

        try {
            const ip = publicIp || await fetchPublicIP();
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/security/audit-log`, {
                event_type: eventType,
                status: status
            }, {
                headers: {
                    Authorization: `Bearer ${activeSession.access_token}`,
                    'x-public-ip': ip
                }
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }, [session, publicIp]);

    // 1. Immediate URL Hash Cleanup (Prevention of Supabase "stale URL" errors)
    // CRITICAL: Do NOT clean up if this is a redirection hash (e.g. email confirmation)
    useEffect(() => {
        if (window.location.hash && !window.location.hash.includes('type=email_change')) {
            window.history.replaceState(null, null, window.location.pathname);
        }
    }, []);

    // 2. Fetch User Profile (Source of Truth: public.users)
    const fetchProfile = useCallback(async (currentSession) => {
        const tokenStr = currentSession?.access_token;
        if (!tokenStr) return;

        const now = Date.now();
        if (globalLock.profile.token === tokenStr && (now - globalLock.profile.time < 3000)) {
            return;
        }
        globalLock.profile = { token: tokenStr, time: now };

        try {
            console.log(`[Auth] Fetching Profile for ${currentSession.user?.email}`);
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${tokenStr}` }
            });
            setUserProfile(response.data);
        } catch (error) {
            console.error("Profile fetch failed:", error?.message || error);
            // Fallback to session metadata to prevent blank UI
            if (currentSession?.user) {
                setUserProfile({
                    full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || "User",
                    name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || "User",
                    email: currentSession.user.email,
                    role: "Auditor",
                    organization: "UNESCO",
                    initials: (currentSession.user.user_metadata?.full_name || currentSession.user.email || "U")[0].toUpperCase()
                });
            }
        }
    }, []);

    // 3. Initial Session Check & Subscription
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Session fetch error:", error);
                    if (mounted) setLoading(false);
                    return;
                }

                if (mounted) {
                    sessionTokenRef.current = initialSession?.access_token || null;
                    setSession(initialSession);
                    if (initialSession?.access_token) {
                        await fetchProfile(initialSession);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error("Auth init failed:", error);
                if (mounted) setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (mounted) {
                const newToken = newSession?.access_token || null;
                const hasSessionTokenChanged = newToken !== sessionTokenRef.current;

                console.log(`[Auth Event] ${event} | Token Changed: ${hasSessionTokenChanged}`);

                // INITIAL_SESSION: Always sync session state to handle race conditions with getSession()
                // This ensures session is properly restored on page refresh
                if (event === 'INITIAL_SESSION') {
                    sessionTokenRef.current = newToken;
                    setSession(newSession);
                    if (newToken && !userProfile) {
                        await fetchProfile(newSession);
                    }
                    setLoading(false);
                    return;
                }

                if (hasSessionTokenChanged) {
                    sessionTokenRef.current = newToken;
                    setSession(newSession);

                    if (newToken) {
                        await fetchProfile(newSession);
                        if (event === 'SIGNED_IN') {
                            logSecurityEvent('LOGIN', 'SUCCESS', newSession);
                        }
                    } else {
                        setUserProfile(null);
                    }
                }
            }
        });

        fetchPublicIP();
        initAuth();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 4. Logout
    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        sessionTokenRef.current = null;
        setSession(null);
        setUserProfile(null);
    }, []);

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // The onAuthStateChange listener will handle state updates
        } catch (error) {
            console.error("Error signing out:", error.message);
        }
    };

    // 5. Axios Interceptor for Auto-Logout on 401
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.warn("Session expired (401). Logging out...");
                    logout();
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [logout]);

    const authValue = useMemo(() => ({
        session, userProfile, loading, logout, signOut, fetchProfile
    }), [session, userProfile, loading, logout, signOut, fetchProfile]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};
