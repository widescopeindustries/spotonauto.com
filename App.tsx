
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import GuidePage from './pages/GuidePage';
import DiagnosticPage from './pages/DiagnosticPage';
import AuthPage from './pages/AuthPage';
import HistoryPage from './pages/HistoryPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CELLandingPage from './pages/CELLandingPage';
import { initGA4, trackPageView } from './services/analytics';

/** Track page views on route changes */
const RouteTracker: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};

const App: React.FC = () => {
  // Initialize GA4 once on mount
  useEffect(() => {
    initGA4();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <RouteTracker />
        <Routes>
          {/* Landing page - no header/footer chrome for ad traffic */}
          <Route path="/cel" element={<CELLandingPage />} />

          {/* Main app shell with header/footer */}
          <Route path="*" element={<AppShell />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
};

/** Main app layout with header and footer */
const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-black">
      <HeaderWithNav />
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/repair/:year/:make/:model/:task" element={<GuidePage />} />
          <Route path="/diagnose" element={<DiagnosticPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const HeaderWithNav: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Header
      onAuthClick={() => navigate('/auth')}
      onHistoryClick={() => navigate('/history')}
    />
  );
};

export default App;
