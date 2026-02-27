import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DiagnosticChat from '../components/DiagnosticChat';
import SEOHead from '../components/seo/SEOHead';
import { Vehicle } from '../types';

const DiagnosticPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // Allow direct access for "demo" feel, or use state if present
    const state = location.state as { vehicle?: Vehicle; initialProblem?: string } | null;

    return (
        <>
            <SEOHead
                title="Antigravity Diagnostic Core"
                description="AI-powered diagnostic chat assistant."
            />
            <div className="p-4 md:p-8 flex flex-col items-center w-full min-h-[calc(100vh-80px)]">
                <h1 className="text-2xl font-mono text-neon-cyan mb-8 tracking-widest uppercase">
                    {state?.vehicle ? `${state.vehicle.year} ${state.vehicle.make} ${state.vehicle.model} // ` : ''}
                    SYSTEM DIAGNOSTICS
                </h1>
                <DiagnosticChat
                    vehicle={state?.vehicle}
                    initialProblem={state?.initialProblem}
                />

                <button
                    onClick={() => navigate('/')}
                    className="mt-8 text-gray-500 hover:text-neon-cyan font-mono text-xs tracking-widest uppercase transition-colors"
                >
                    Terminate Session
                </button>
            </div>
        </>
    );
};

export default DiagnosticPage;
