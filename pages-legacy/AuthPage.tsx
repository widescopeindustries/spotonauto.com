
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import SEOHead from '../components/seo/SEOHead';

const AuthPage: React.FC = () => {
    const navigate = useNavigate();

    const handleAuthSuccess = () => {
        navigate('/');
    };

    return (
        <>
            <SEOHead title="Login / Sign Up | AI Auto Repair" description="Access premium features." />
            <div className="flex items-center justify-center p-4 md:p-8 min-h-[50vh]">
                <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
        </>
    );
};

export default AuthPage;
