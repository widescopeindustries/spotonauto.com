
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WrenchIcon } from './Icons';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { loginWithEmail, signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signup(email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
        setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleLogin = async () => {
      try {
          await loginWithGoogle();
      } catch (err: any) {
          setError(err.message || 'Google Login failed');
      }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="text-center mb-8">
            <WrenchIcon className="w-12 h-12 mx-auto text-brand-cyan" />
            <h1 className="text-3xl font-bold text-white mt-4 uppercase tracking-wider">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-md text-gray-300 mt-1">
                {isLogin ? 'Sign in to access your premium features.' : 'Sign up to get started.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 backdrop-blur-sm border border-brand-cyan/30 p-8 rounded-xl space-y-6">
            {error && <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-500/50">{error}</div>}
            
            <div className="space-y-4">
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
                        required
                    />
                 </div>
                 <div>
                    <label htmlFor="password"className="block text-sm font-medium text-gray-300">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
                        required
                        minLength={6}
                    />
                 </div>
            </div>

            <button
                type="submit"
                className="w-full bg-brand-cyan text-black font-bold py-3 px-4 rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300"
            >
                {isLogin ? 'Log In' : 'Sign Up'}
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all duration-300 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
            </button>

            <p className="text-sm text-center text-gray-300">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-semibold text-brand-cyan hover:underline ml-1">
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </form>
    </div>
  );
};

export default AuthForm;