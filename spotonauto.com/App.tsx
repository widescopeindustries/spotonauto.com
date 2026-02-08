
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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
import NotFoundPage from './pages/NotFoundPage';

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
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            {/* Catch-all route for 404 handling */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </Router>
        </HelmetProvider>
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
