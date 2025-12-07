
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GuidePage from './pages/GuidePage';
import DiagnosticPage from './pages/DiagnosticPage';
import AuthPage from './pages/AuthPage';
import HistoryPage from './pages/HistoryPage';

const App: React.FC = () => {
  // Header navigation handler - since Header is outside Routes, 
  // it can't use `useNavigate` directly unless wrapped.
  // So we wrap the inner content.

  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen w-full flex flex-col bg-black">
          <HeaderWithNav />
          <main className="flex-grow w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/repair/:year/:make/:model/:task" element={<GuidePage />} />
              <Route path="/diagnose" element={<DiagnosticPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </HelmetProvider>
  );
};

// Helper to allow Header to use navigation
import { useNavigate } from 'react-router-dom';

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
