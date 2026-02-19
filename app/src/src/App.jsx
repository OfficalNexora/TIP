import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardProvider, useUI, useData, useActions, useScan } from './contexts/DashboardContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { Capacitor } from '@capacitor/core';

// Assets & Global CSS
import './global.css';

// Components
import Landing from './components/views/Landing';
import Auth from './components/views/Auth';
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import Overview from './components/dashboard/Overview';
import Upload from './components/dashboard/Upload';
import Scanning from './components/dashboard/Scanning';
import Results from './components/dashboard/Results';
import AnalyticPanel from './components/dashboard/AnalyticPanel';
import ScanHistory from './components/dashboard/ScanHistory';
import ComplianceProfile from './components/dashboard/ComplianceProfile';
import Settings from './components/dashboard/Settings';
import SubscriptionModal from './components/dashboard/SubscriptionModal';
import BottomNav from './components/mobile/BottomNav';
import MobileHome from './components/mobile/MobileHome';
import MobileUpload from './components/mobile/MobileUpload';
import MobileResults from './components/mobile/MobileResults';
import MobileHistory from './components/mobile/MobileHistory';
import MobileSettings from './components/mobile/MobileSettings';

import Loader from './components/ui/Loader';
import LagNotifier from './components/ui/LagNotifier';
import Chatbot from './components/ui/Chatbot';

// Check for email confirmation redirect BEFORE any effects clear the URL
const initialUrl = window.location.href;
const isEmailConfirmationRedirect = initialUrl.includes('type=email_change') || initialUrl.includes('type=signup') || initialUrl.includes('type=recovery');

function AppContent() {
  const { session, loading: authLoading } = useAuth();
  const { dashboardState, rightPanelOpen, isHandshaking, lagMetrics, isChatOpen } = useUI();
  const { files, activeFile, searchTerm, integrityAvg, totalAudits, loadingHistory } = useData();
  const { setDashboardState, setRightPanelOpen, setSubscriptionOpen, setIsChatOpen, loadFile, setSearchTerm, startScan } = useActions();
  const { scanStatus } = useScan();

  const handshakeActive = isHandshaking;

  console.log("AppContent Handshake Status:", handshakeActive);

  // Initialize appState based on whether this is an email confirmation redirect
  // On Native (Mobile), we skip LANDING and go straight to AUTH (Grammarly-style)
  const isNative = Capacitor.isNativePlatform();
  const [appState, setAppState] = useState(() => {
    if (isEmailConfirmationRedirect) return 'EMAIL_CONFIRMED';
    return isNative ? 'AUTH' : 'LANDING';
  });
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [randomText, setRandomText] = useState("");

  // Random Text Effect
  useEffect(() => {
    const envText = import.meta.env.VITE_RANDOM_TEXTS;
    const texts = envText ? envText.split('|') : [
      "Global AI Compliance Standards",
      "UNESCO Integrity Protocol",
      "Institutional Audit Framework",
      "Ethical Algorithmic Verification"
    ];
    if (texts.length > 0) {
      setRandomText(texts[Math.floor(Math.random() * texts.length)]);
    }
  }, []);

  // Sync AppState with Session
  useEffect(() => {
    if (!authLoading) {
      const fullUrl = window.location.href;

      // Check for email confirmation redirect (Supabase uses hashes or query params)
      if (fullUrl.includes('type=email_change')) {
        setAppState('EMAIL_CONFIRMED');
        return;
      }

      // Preserve user-initiated states (don't override if user navigated to EMAIL_CONFIRMED)
      if (appState === 'EMAIL_CONFIRMED') return;

      // If we have a session, always go to DASHBOARD (unless email confirmed flow)
      if (session) {
        if (appState !== 'DASHBOARD') setAppState('DASHBOARD');
        return;
      }

      // If no session, and we are not in AUTH or EMAIL_CONFIRMED, go to LANDING (or AUTH if native)
      if (appState !== 'AUTH' && appState !== 'LANDING') {
        setAppState(isNative ? 'AUTH' : 'LANDING');
      }
    }
  }, [session, authLoading, appState]);

  // COMBINED LOADING GUARD (Session check + Institutional Handshake)
  if (authLoading || (session && handshakeActive)) return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center transition-colors">
      <Loader />
      <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-[0.5em] mt-10 animate-pulse">
        {authLoading ? 'Initializing Secure Context' : 'Establishing Institutional Handshake'}
      </p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-tip-bg text-tip-text-main relative overflow-hidden font-sans transition-colors duration-300">

      {/* DEBUG BANNER */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-[10px] font-bold text-center px-2 py-1 pointer-events-none opacity-80">
        DEBUG MODE: Native={isNative ? 'TRUE' : 'FALSE'} | AppState={appState} | Dash={dashboardState}
      </div>

      {/* GLOBAL BACKGROUND GLOWS */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full"></div>
      </div>

      {/* 1. LANDING */}
      {appState === 'LANDING' && (
        <main className="contents">
          <Landing
            videoLoaded={videoLoaded}
            randomText={randomText}
            onStart={() => setAppState('AUTH')}
          />
        </main>
      )}

      {/* 2. AUTH */}
      {appState === 'AUTH' && (
        <main className="contents">
          <Auth />
        </main>
      )}

      {/* 2.5 EMAIL CONFIRMED */}
      {appState === 'EMAIL_CONFIRMED' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-6 bg-tip-bg">
          <div className="glass-card p-10 w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4">Email Confirmed</h2>
            <p className="text-slate-400 mb-10 max-w-[280px] mx-auto text-sm font-medium leading-relaxed">
              Your institutional identity has been successfully updated.
            </p>
            <button
              onClick={() => {
                window.history.replaceState(null, null, window.location.pathname);
                setAppState('AUTH');
              }}
              className="btn-premium w-full"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD */}
      {appState === 'DASHBOARD' && (
        <div className="fixed inset-0 z-30 flex flex-col md:flex-row animate-fade-in overflow-hidden">

          <Sidebar />
          <BottomNav />

          <main className="flex-1 flex flex-col relative min-w-0 bg-transparent overflow-hidden">
            <Header setAppState={setAppState} />

            <div className={`flex-1 ${['SCANNING', 'UPLOAD', 'OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? 'overflow-hidden' : 'overflow-y-auto'} ${['OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? 'p-0' : 'p-6 md:p-12'} custom-scrollbar`}>
              <div className={`h-full flex flex-col ${['RESULTS', 'OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? 'w-full' : 'max-w-5xl mx-auto md:pb-0 pb-24'}`}>

                {dashboardState === 'OVERVIEW' && (
                  isNative ? <MobileHome /> : <Overview />
                )}

                {dashboardState === 'HISTORY' && (
                  isNative ? <MobileHistory /> : <ScanHistory />
                )}

                {dashboardState === 'UPLOAD' && (
                  isNative ? <MobileUpload /> : <Upload />
                )}

                {dashboardState === 'SCANNING' && (
                  <div className="h-full w-full">
                    <Scanning />
                  </div>
                )}

                {dashboardState === 'RESULTS' && activeFile && (
                  isNative ? <MobileResults /> : <Results />
                )}

                {dashboardState === 'PROFILE' && (
                  <ComplianceProfile />
                )}

                {dashboardState === 'COMPLIANCE' && (
                  <ComplianceProfile />
                )}

                {dashboardState === 'SETTINGS' && (
                  isNative ? <MobileSettings /> : <Settings />
                )}

              </div>
            </div>
          </main>

          <AnalyticPanel />

          <SubscriptionModal />

          {/* Lag Detection Notifier */}
          <LagNotifier />
        </div>
      )}

      {/* AI Chat Assistant — rendered outside dashboard flex to avoid z-index stacking issues */}
      {appState === 'DASHBOARD' && (
        <Chatbot />
      )}
    </div>

  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <OfflineProvider>
          <ThemeProvider>
            <DashboardProvider>
              <AppContent />
            </DashboardProvider>
          </ThemeProvider>
        </OfflineProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
