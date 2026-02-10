import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Assets & Global CSS
import earthVideo from './assets/earth-video-small.mp4';
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

import Loader from './components/ui/Loader';
import LagNotifier from './components/ui/LagNotifier';
import Chatbot from './components/ui/Chatbot';

// Check for email confirmation redirect BEFORE any effects clear the URL
const initialUrl = window.location.href;
const isEmailConfirmationRedirect = initialUrl.includes('type=email_change') || initialUrl.includes('type=signup') || initialUrl.includes('type=recovery');

function AppContent() {
  const { session, loading: authLoading } = useAuth();
  const {
    isHandshaking: handshakeActive, loadingHistory,
    dashboardState, setDashboardState,
    activeFile, setActiveFile, loadFile,
    files,
    searchTerm, setSearchTerm,
    rightPanelOpen, setRightPanelOpen,
    isSubscriptionOpen, setSubscriptionOpen,
    integrityAvg, totalAudits,
    scanStatus, startScan,
    // Interactive Audit
    focusedIssue, setFocusedIssue,
    // Chatbot
    isChatOpen, setIsChatOpen
  } = useDashboard();

  console.log("AppContent Handshake Status:", handshakeActive);

  // Initialize appState based on whether this is an email confirmation redirect
  const [appState, setAppState] = useState(isEmailConfirmationRedirect ? 'EMAIL_CONFIRMED' : 'LANDING');
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

      // If no session, and we are not in AUTH or EMAIL_CONFIRMED, go to LANDING
      if (appState !== 'AUTH' && appState !== 'LANDING') {
        setAppState('LANDING');
      }
    }
  }, [session, authLoading, appState]);

  // COMBINED LOADING GUARD (Session check + Institutional Handshake)
  if (authLoading || (session && handshakeActive)) return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center transition-colors">
      <Loader />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-8 animate-pulse">
        {authLoading ? 'Initializing Secure Context' : 'Establishing Institutional Handshake'}
      </p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-tip-bg text-tip-text-main relative overflow-hidden font-sans transition-colors duration-300">

      {/* GLOBAL BACKGROUND */}
      <div className="fixed inset-0 z-0 bg-tip-bg">
        {(appState === 'LANDING' || appState === 'AUTH') ? (
          <>
            <video
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
              <source src={earthVideo} type="video/mp4" />
            </video>
            <div className="overlay-institutional"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-[#F0F4F8] dark:from-slate-900 dark:to-slate-950 transition-colors duration-500"></div>
        )}
      </div>

      {/* 1. LANDING */}
      {appState === 'LANDING' && (
        <Landing
          videoLoaded={videoLoaded}
          randomText={randomText}
          onStart={() => setAppState('AUTH')}
        />
      )}

      {/* 2. AUTH */}
      {appState === 'AUTH' && (
        <Auth />
      )}

      {/* 2.5 EMAIL CONFIRMED */}
      {appState === 'EMAIL_CONFIRMED' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent animate-in fade-in duration-700 p-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-10 w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-700 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Email Confirmed</h2>
            <p className="text-slate-400 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
              Your institutional identity has been successfully updated. You can now use your new email to sign in.
            </p>
            <button
              onClick={() => {
                // Clear the hash/query and go to login
                window.history.replaceState(null, null, window.location.pathname);
                setAppState('AUTH');
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD */}
      {appState === 'DASHBOARD' && (
        <div className="fixed inset-0 z-30 flex animate-fade-in">

          <Sidebar
            dashboardState={dashboardState}
            setDashboardState={setDashboardState}
            activeFile={activeFile}
            files={files}
            loadFile={loadFile}
            setActiveFile={setActiveFile}
            onUpgrade={() => setSubscriptionOpen(true)}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
          />

          <main className="flex-1 flex flex-col relative min-w-0 bg-transparent">
            <Header
              dashboardState={dashboardState}
              activeFile={activeFile}
              rightPanelOpen={rightPanelOpen}
              setRightPanelOpen={setRightPanelOpen}
              setAppState={setAppState}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setDashboardState={setDashboardState}
              files={files}
              loadFile={loadFile}
            />

            <div className={`flex-1 ${['SCANNING', 'UPLOAD', 'OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? 'overflow-hidden' : 'overflow-y-auto'} ${['OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? 'p-0' : 'p-8 md:p-12'} custom-scrollbar`}>
              <div className={`h-full flex flex-col ${['RESULTS', 'OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? 'w-full' : 'max-w-5xl mx-auto'} ${['UPLOAD', 'SCANNING', 'RESULTS', 'OVERVIEW', 'SETTINGS', 'HISTORY'].includes(dashboardState) ? '' : 'pb-20'}`}>

                {dashboardState === 'OVERVIEW' && (
                  <Overview
                    files={files}
                    setDashboardState={setDashboardState}
                    setActiveFile={setActiveFile}
                    loadFile={loadFile}
                    searchTerm={searchTerm}
                    integrityAvg={integrityAvg}
                    totalAudits={totalAudits}
                    loading={loadingHistory}
                  />
                )}

                {dashboardState === 'HISTORY' && (
                  <ScanHistory
                    files={files}
                    loadFile={loadFile}
                  />
                )}

                {dashboardState === 'UPLOAD' && (
                  <Upload onStartScan={startScan} />
                )}

                {dashboardState === 'SCANNING' && (
                  <Scanning filename={activeFile?.filename} status={scanStatus} />
                )}

                {dashboardState === 'RESULTS' && activeFile && (
                  <Results activeFile={activeFile} />
                )}

                {dashboardState === 'PROFILE' && (
                  <ComplianceProfile
                    integrityAvg={integrityAvg}
                    totalAudits={totalAudits}
                  />
                )}

                {dashboardState === 'COMPLIANCE' && (
                  <ComplianceProfile
                    integrityAvg={integrityAvg}
                    totalAudits={totalAudits}
                  />
                )}

                {dashboardState === 'SETTINGS' && (
                  <Settings />
                )}

              </div>
            </div>
          </main>

          <AnalyticPanel
            activeFile={activeFile}
            isOpen={rightPanelOpen}
            onClose={() => setRightPanelOpen(false)}
          />

          <SubscriptionModal
            isOpen={isSubscriptionOpen}
            onClose={() => setSubscriptionOpen(false)}
            onUpgrade={() => alert("Contact Sales for Institutional Access.")}
          />

          {/* Lag Detection Notifier */}
          <LagNotifier />
        </div>
      )}

      {/* AI Chat Assistant — rendered outside dashboard flex to avoid z-index stacking issues */}
      {appState === 'DASHBOARD' && (
        <Chatbot
          analysisId={activeFile?.id}
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
        />
      )}
    </div>

  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <DashboardProvider>
            <AppContent />
          </DashboardProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
