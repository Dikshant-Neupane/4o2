import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Navbar from './components/layout/Navbar';

console.log('[PHASE 1] Routes configured');

// ---------------------------------------------------------------------------
// Lazy-loaded pages
// ---------------------------------------------------------------------------
const HomePage = lazy(() => import('./pages/HomePage'));
const ReportWizard = lazy(() => import('./pages/ReportWizard'));
const SubmissionSuccess = lazy(() => import('./pages/SubmissionSuccess'));
const CommunityFeed = lazy(() => import('./pages/CommunityFeed'));
const MapPage = lazy(() => import('./pages/MapPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ---------------------------------------------------------------------------
// Loading Spinner (used by Suspense fallback)
// ---------------------------------------------------------------------------
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-civic-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-civic-blue/20 border-t-civic-blue rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500 tracking-wide">Loading…</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RequireAuth — redirects to /login if not authenticated
// Waits for hydration before making any decisions
// ---------------------------------------------------------------------------
function RequireAuth({ children }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  if (!isHydrated) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ---------------------------------------------------------------------------
// App Component
// RULES:
// 1. <Navbar /> rendered HERE and ONLY here — never inside any page
// 2. No motion.div or AnimatePresence wrapping children at this level
// 3. No overflow:hidden on any wrapper
// 4. No transform on any wrapper that contains the navbar
// ---------------------------------------------------------------------------
export default function App() {
  const { isHydrated, hydrateUser } = useAuthStore();

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  if (!isHydrated) return <LoadingSpinner />;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* ← Navbar lives HERE. Never in any page file. */}
      <Navbar />

      {/* 
        CRITICAL: no transform, filter, will-change, or perspective here
      */}
      <main
        style={{
          minHeight: '100vh',
          paddingTop: '160px',
          backgroundColor: '#F8F9FC',
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<CommunityFeed />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/report/:id" element={<ReportDetail />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/report"
              element={
                <RequireAuth>
                  <ReportWizard />
                </RequireAuth>
              }
            />
            <Route
              path="/success/:id"
              element={
                <RequireAuth>
                  <SubmissionSuccess />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

