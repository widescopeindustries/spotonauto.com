
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DiagnosticAssistant from '../components/DiagnosticAssistant';
import SEOHead from '../components/seo/SEOHead';
import { Vehicle } from '../types';

const DiagnosticPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { vehicle?: Vehicle; initialProblem?: string } | null;

    if (!state?.vehicle) {
        // Redirect if no vehicle state (came here directly)
        // In future: Show a form to specific diagnostic
        return (
            <div className="p-8 text-center text-white">
                <p>Please select a vehicle first.</p>
                <button onClick={() => navigate('/')} className="text-brand-cyan mt-4">Go Home</button>
            </div>
        );
    }

    return (
        <>
            <SEOHead
                title={`Diagnostic Assistant - ${state.vehicle.year} ${state.vehicle.make} ${state.vehicle.model}`}
                description="AI-powered diagnostic chat assistant."
            />
            <div className="p-4 md:p-8 flex justify-center w-full">
                <DiagnosticAssistant
                    vehicle={state.vehicle}
                    initialProblem={state.initialProblem || ''}
                    onReset={() => navigate('/')}
                />
            </div>
        </>
    );
};

export default DiagnosticPage;
