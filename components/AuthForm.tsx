
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
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    if (email && password) {
      login(email);
      onAuthSuccess();
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
                    />
                 </div>
            </div>

            <button
                type="submit"
                className="w-full bg-brand-cyan text-black font-bold py-3 px-4 rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300"
            >
                {isLogin ? 'Log In' : 'Sign Up'}
            </button>

            <p className="text-sm text-center text-gray-300">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-semibold text-brand-cyan hover:underline ml-1">
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </form>
    </div>
  );
};

export default AuthForm;