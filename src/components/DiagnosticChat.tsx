import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, Activity, ImageIcon, Camera, Lock, Zap } from 'lucide-react';
import { createDiagnosticChat, sendDiagnosticMessage, Chat } from '../services/apiClient';
import { Vehicle, SubscriptionTier } from '../types';
import { trackDiagnosisUse } from '../lib/usageTracker';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from './UpgradeModal';

interface DiagnosticChatProps {
    vehicle?: Vehicle;
    initialProblem?: string;
}

interface Message {
    id: string;
    type: 'system' | 'user';
    text: string;
    imageUrl?: string | null;
    options?: string[];
}

const DiagnosticChat: React.FC<DiagnosticChatProps> = ({ vehicle: vehicleProp, initialProblem: initialProblemProp }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [typing, setTyping] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [userInput, setUserInput] = useState('');
    const [limitReached, setLimitReached] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Determine pro status from Supabase (via AuthContext) — NOT localStorage
    const isPro = user?.tier === SubscriptionTier.Pro || user?.tier === SubscriptionTier.ProPlus;

    // Free users get 1 diagnostic session (tracked on first message send)
    const FREE_MESSAGE_LIMIT = 6; // Allow a few back-and-forth messages per session

    const vehicle = vehicleProp || (searchParams.get('year') && searchParams.get('make') && searchParams.get('model')
        ? { year: searchParams.get('year')!, make: searchParams.get('make')!, model: searchParams.get('model')! }
        : null);

    const initialProblem = initialProblemProp || searchParams.get('task') || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typing]);

    useEffect(() => {
        const initChat = async () => {
            // Wait for vehicle from search params or props
            if (!vehicle) return;

            try {
                const chat = createDiagnosticChat(vehicle);
                setChatSession(chat);

                // Initial greeting
                setTyping(true);

                // Simulate boot sequence
                setTimeout(() => {
                    const greeting = initialProblem
                        ? `Diagnostic Core Online. Analyzing provided symptom: "${initialProblem}"...`
                        : `Diagnostic Core Online. Connected to ${vehicle.year} ${vehicle.make} ${vehicle.model} database. Accessing factory-level technical service bulletins and professional diagnostic manuals. Please describe the primary symptom.`;

                    setMessages([{
                        id: 'init',
                        type: 'system',
                        text: greeting,
                    }]);

                    if (initialProblem) {
                        // Automatically send the initial problem to the AI to get the first real step
                        handleUserResponse(initialProblem, chat);
                    } else {
                        setTyping(false);
                    }
                }, 1500);

            } catch (err) {
                console.error("Failed to init chat", err);
                setMessages([{
                    id: 'error',
                    type: 'system',
                    text: "Error initializing Diagnostic Core. Please refresh connection."
                }]);
                setTyping(false);
            }
        };

        if (!chatSession && vehicle) {
            initChat();
        }
    }, [vehicle]);

    const handleUserResponse = async (text: string, activeChat = chatSession) => {
        if (!text.trim() || !activeChat) return;

        // Check usage limits for free users (isPro sourced from Supabase via AuthContext)
        if (!isPro) {
            // On first user message, track the diagnosis use
            if (messageCount === 0) {
                const { allowed } = trackDiagnosisUse();
                if (!allowed) {
                    setLimitReached(true);
                    setShowUpgradeModal(true);
                    return;
                }
            }

            // Limit conversation length for free users
            if (messageCount >= FREE_MESSAGE_LIMIT) {
                setLimitReached(true);
                setShowUpgradeModal(true);
                return;
            }
            setMessageCount(prev => prev + 1);
        }

        // If it's the initial auto-send, we don't need to duplicate the user message visually if we don't want to,
        // but it's consistent to show what the "user" said (or passed in).
        // For initialProblem, we might skip adding it to 'messages' if we want it to feel like the context was pre-loaded.
        // But simpler is usually better: just add it.

        // However, if called from useEffect with initialProblem, activeChat is passed explicitly.
        // We need to differentiate if we are adding to UI or just sending.
        // Let's add to UI for clarity.

        const isInitial = text === initialProblem && messages.length === 1; // Rough check

        if (!isInitial) {
            const userMsg: Message = {
                id: Date.now().toString(),
                type: 'user',
                text: text
            };
            setMessages(prev => [...prev, userMsg]);
        }

        setUserInput('');
        setTyping(true);

        try {
            const response = await sendDiagnosticMessage(activeChat, text);

            const systemMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'system',
                text: response.text,
                imageUrl: response.imageUrl
            };

            setMessages(prev => [...prev, systemMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'system',
                text: "Communication Error. Re-establishing link..."
            }]);
        } finally {
            setTyping(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleUserResponse(userInput);
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto border border-neon-cyan/20 rounded-xl bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            {/* Header */}
            <div className="p-4 border-b border-neon-cyan/20 flex items-center justify-between bg-black/50 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                    <h3 className="text-neon-cyan font-mono tracking-widest text-sm">AI DIAGNOSTIC CORE v3.0 // {vehicle?.model || 'UNLINKED'}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {/* Free user message counter */}
                    {!isPro && (
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                        >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400 font-mono text-[10px] tracking-wider">
                                {Math.max(0, FREE_MESSAGE_LIMIT - messageCount)}/{FREE_MESSAGE_LIMIT} FREE
                            </span>
                        </button>
                    )}
                    <Cpu className="text-neon-cyan/50 w-5 h-5" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-thin scrollbar-thumb-neon-cyan/20 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] rounded-lg p-4 font-mono text-sm leading-relaxed border ${msg.type === 'user'
                                ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan'
                                : 'bg-gray-900/90 border-gray-700 text-white shadow-lg'
                                }`}>
                                <p>{msg.text}</p>
                                {msg.imageUrl && (
                                    <div className="mt-4 rounded border border-neon-cyan/20 overflow-hidden relative group">
                                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-neon-cyan flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> AI GENERATED
                                        </div>
                                        <img src={msg.imageUrl} alt="Diagnostic Illustration" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {typing && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-start"
                        >
                            <div className="bg-gray-900/80 border border-gray-700 px-4 py-3 rounded-lg flex items-center gap-1">
                                <Activity className="w-4 h-4 text-neon-cyan animate-spin" />
                                <span className="text-xs font-mono text-neon-cyan/70 ml-2">ANALYZING TELEMETRY...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-neon-cyan/20 bg-black/60 z-10">
                {limitReached ? (
                    <div className="text-center py-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 font-mono text-sm">FREE DIAGNOSTIC LIMIT REACHED</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-3">
                            Upgrade to Pro for unlimited AI diagnostics and repair guides.
                        </p>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="bg-neon-cyan text-black font-bold py-2 px-6 rounded-lg text-sm hover:bg-cyan-400 transition-all"
                        >
                            Upgrade to Pro — $9.99/mo
                        </button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={onSubmit} className="flex gap-3 relative">
                            <div className="absolute inset-0 bg-neon-cyan/5 blur-xl -z-10"></div>
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder={typing ? "Awaiting System Response..." : "Enter symptoms, codes, or observations..."}
                                className="flex-1 bg-black/50 border border-neon-cyan/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan font-mono text-sm transition-all"
                                disabled={typing}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={typing || !userInput.trim()}
                                className="bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-cyan flex items-center justify-center"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 text-gray-400 px-3 rounded-lg transition-colors"
                                title="Upload Image (Coming Soon)"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-gray-500 font-mono">POWERED BY GEMINI 2.0 // FACTORY MANUAL PROTOCOL ENABLED</span>
                        </div>
                    </>
                )}
            </div>
            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onAuthClick={() => router.push('/auth')}
                trigger="diagnosis-limit"
            />
        </div>
    );
};

export default DiagnosticChat;

