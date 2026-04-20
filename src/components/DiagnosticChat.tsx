import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Camera, Cpu, HardDrive, ImageIcon, RotateCcw, Send } from 'lucide-react';
import { buildSymptomHref, getSymptomClusterFromText } from '@/data/symptomGraph';
import { createDiagnosticChat, sendDiagnosticMessage, type Chat } from '../services/apiClient';
import {
    findLatestDiagnosticSessionForVehicle,
    getDiagnosticSession,
    saveDiagnosticSession,
    type StoredDiagnosticMessage,
} from '../services/diagnosticMemory';
import type { Vehicle } from '../types';
import TopdonDiagnosticInjected from './TopdonDiagnosticInjected';

interface DiagnosticChatProps {
    vehicle?: Vehicle;
    initialProblem?: string;
}

type Message = StoredDiagnosticMessage;

function vehiclesMatch(left: Vehicle, right: Vehicle): boolean {
    return (
        left.year.toLowerCase() === right.year.toLowerCase() &&
        left.make.toLowerCase() === right.make.toLowerCase() &&
        left.model.toLowerCase() === right.model.toLowerCase()
    );
}

function buildGreeting(vehicle: Vehicle, initialProblem: string): string {
    if (initialProblem) {
        return `Diagnostic Core Online. Analyzing provided symptom: "${initialProblem}"...`;
    }

    return `Diagnostic Core Online. Connected to ${vehicle.year} ${vehicle.make} ${vehicle.model} database. Accessing factory-level technical service bulletins and professional diagnostic manuals. Please describe the primary symptom.`;
}

const DiagnosticChat: React.FC<DiagnosticChatProps> = ({ vehicle: vehicleProp, initialProblem: initialProblemProp }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [typing, setTyping] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [userInput, setUserInput] = useState('');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [sessionCreatedAt, setSessionCreatedAt] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const vehicle = vehicleProp || (searchParams.get('year') && searchParams.get('make') && searchParams.get('model')
        ? { year: searchParams.get('year')!, make: searchParams.get('make')!, model: searchParams.get('model')! }
        : null);

    const initialProblem = initialProblemProp || searchParams.get('task') || '';
    const threadId = searchParams.get('thread');
    const forceFresh = searchParams.get('fresh') === '1';
    const canonicalSymptomCluster = (() => {
        const candidateTexts = [
            initialProblem,
            ...messages
                .filter((message) => message.type === 'user')
                .map((message) => message.text)
                .reverse(),
        ];

        for (const text of candidateTexts) {
            const cluster = getSymptomClusterFromText(text);
            if (cluster) return cluster;
        }

        return null;
    })();

    const syncThreadInUrl = useCallback((nextThreadId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('thread', nextThreadId);
        params.delete('fresh');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const sendMessageToChat = useCallback(async (
        text: string,
        activeChat: Chat,
        options?: { skipUserEcho?: boolean }
    ) => {
        if (!text.trim()) return;

        if (!options?.skipUserEcho) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-user`,
                    type: 'user',
                    text,
                },
            ]);
        }

        setUserInput('');
        setTyping(true);
        setStatusMessage(null);

        try {
            const response = await Promise.race([
                sendDiagnosticMessage(activeChat, text),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 20000)
                ),
            ]);

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-system`,
                    type: 'system',
                    text: response.text,
                    imageUrl: response.imageUrl,
                },
            ]);
        } catch (error: any) {
            let message = 'Unable to complete diagnosis right now. Please try again.';
            const errorText = String(error?.message || '');

            if (errorText.includes('REQUEST_TIMEOUT')) {
                message = 'Diagnosis timed out after 20 seconds. Please retry, or shorten your symptom description.';
            } else if (errorText.toLowerCase().includes('authentication required')) {
                message = 'Please sign in, then try diagnosis again.';
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-error`,
                    type: 'system',
                    text: message,
                },
            ]);
            setStatusMessage(message);
        } finally {
            setTyping(false);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    useEffect(() => {
        if (!vehicle) return;

        if (chatSession && vehiclesMatch(chatSession.vehicle, vehicle)) {
            if (threadId) {
                if (!forceFresh && chatSession.id === threadId) {
                    return;
                }
            } else if (!forceFresh || messages.length > 0) {
                return;
            }
        }

        let cancelled = false;

        const initChat = async () => {
            setMessages([]);
            setTyping(false);
            setUserInput('');
            setStatusMessage(null);

            const storedSession = !forceFresh
                ? (threadId ? getDiagnosticSession(threadId) : findLatestDiagnosticSessionForVehicle(vehicle))
                : null;

            if (storedSession && vehiclesMatch(storedSession.vehicle, vehicle)) {
                if (cancelled) return;

                setChatSession(createDiagnosticChat(vehicle, {
                    id: storedSession.id,
                    history: storedSession.history,
                }));
                setMessages(storedSession.messages);
                setSessionCreatedAt(storedSession.createdAt);
                syncThreadInUrl(storedSession.id);
                return;
            }

            const createdAt = new Date().toISOString();
            const nextChat = createDiagnosticChat(vehicle);
            const greeting: Message = {
                id: `${nextChat.id}-greeting`,
                type: 'system',
                text: buildGreeting(vehicle, initialProblem),
            };

            if (cancelled) return;

            setChatSession(nextChat);
            setSessionCreatedAt(createdAt);
            setMessages([greeting]);
            syncThreadInUrl(nextChat.id);

            if (initialProblem) {
                void sendMessageToChat(initialProblem, nextChat, { skipUserEcho: true });
            }
        };

        void initChat();

        return () => {
            cancelled = true;
        };
    }, [chatSession, forceFresh, initialProblem, messages.length, sendMessageToChat, syncThreadInUrl, threadId, vehicle]);

    useEffect(() => {
        if (!vehicle || !chatSession || !sessionCreatedAt || messages.length === 0) return;

        saveDiagnosticSession({
            id: chatSession.id,
            vehicle,
            initialProblem,
            messages,
            history: chatSession.history,
            createdAt: sessionCreatedAt,
            updatedAt: new Date().toISOString(),
        });
    }, [chatSession, initialProblem, messages, sessionCreatedAt, vehicle]);

    const handleUserResponse = async (text: string) => {
        if (!text.trim() || !chatSession) return;
        await sendMessageToChat(text, chatSession);
    };

    const handleFreshThread = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('thread');
        params.delete('task');
        params.set('fresh', '1');

        setChatSession(null);
        setMessages([]);
        setTyping(false);
        setStatusMessage(null);

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleUserResponse(userInput);
    };

    return (
        <div className="relative mx-auto flex h-[600px] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neon-cyan/20 bg-black/80 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="z-10 flex items-center justify-between border-b border-neon-cyan/20 bg-black/50 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
                    <div>
                        <h3 className="font-mono text-sm tracking-widest text-neon-cyan">
                            AI DIAGNOSTIC CORE v3.0 // {vehicle?.model || 'UNLINKED'}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">
                            <HardDrive className="h-3.5 w-3.5" />
                            <span>Persistent memory active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleFreshThread}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300 transition-colors hover:border-cyan-500/30 hover:text-cyan-100"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        New thread
                    </button>
                    <Cpu className="h-5 w-5 text-neon-cyan/50" />
                </div>
            </div>

            <div className="z-10 flex-1 space-y-6 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neon-cyan/20">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg border p-4 font-mono text-sm leading-relaxed ${msg.type === 'user'
                                    ? 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan'
                                    : 'border-gray-700 bg-gray-900/90 text-white shadow-lg'
                                    }`}
                            >
                                <p>{msg.text}</p>
                                {msg.imageUrl && (
                                    <div className="relative mt-4 overflow-hidden rounded border border-neon-cyan/20">
                                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-neon-cyan">
                                            <ImageIcon className="h-3 w-3" /> AI GENERATED
                                        </div>
                                        <img src={msg.imageUrl} alt="Diagnostic Illustration" className="h-auto w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Inject scanner recommendations if the last message pairs imply it's useful */}
                    {messages.length >= 2 && !typing && (
                        <TopdonDiagnosticInjected 
                            lastUserMessage={messages.filter(m => m.type === 'user').slice(-1)[0]?.text || ''}
                            lastAiMessage={messages.filter(m => m.type === 'system').slice(-1)[0]?.text || ''}
                        />
                    )}

                    {typing && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-start"
                        >
                            <div className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-3">
                                <Activity className="h-4 w-4 animate-spin text-neon-cyan" />
                                <span className="ml-2 font-mono text-xs text-neon-cyan/70">ANALYZING TELEMETRY...</span>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </AnimatePresence>
            </div>

            <div className="z-10 border-t border-neon-cyan/20 bg-black/60 p-4">
                {canonicalSymptomCluster && (
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-amber-300/85">Canonical symptom cluster</p>
                                <h4 className="mt-2 text-sm font-semibold text-white">{canonicalSymptomCluster.label}</h4>
                                <p className="mt-1 text-xs leading-5 text-gray-300">{canonicalSymptomCluster.summary}</p>
                            </div>
                            <Link
                                href={buildSymptomHref(canonicalSymptomCluster.slug)}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-400/30 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition-all hover:border-amber-300/50 hover:bg-black/30"
                            >
                                Open Symptom Hub
                            </Link>
                        </div>
                        {canonicalSymptomCluster.likelyTasks.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {canonicalSymptomCluster.likelyTasks.slice(0, 3).map((task) => (
                                    <Link
                                        key={task}
                                        href={`/repairs/${task}`}
                                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 hover:border-cyan-400/35 hover:text-cyan-200 transition-all"
                                    >
                                        {task.replace(/-/g, ' ')}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <form onSubmit={onSubmit} className="relative flex gap-3">
                    <div className="absolute inset-0 -z-10 bg-neon-cyan/5 blur-xl" />
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={typing ? 'Awaiting System Response...' : 'Enter symptoms, codes, or observations...'}
                        className="flex-1 rounded-lg border border-neon-cyan/30 bg-black/50 px-4 py-3 font-mono text-sm text-white placeholder-gray-500 transition-all focus:border-neon-cyan focus:outline-none focus:shadow-glow-cyan"
                        disabled={typing}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={typing || !userInput.trim()}
                        className="flex items-center justify-center rounded-lg border border-neon-cyan bg-neon-cyan/10 px-4 text-neon-cyan transition-all hover:bg-neon-cyan/20 hover:shadow-glow-cyan disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        className="rounded-lg border border-gray-600 bg-gray-800/50 px-3 text-gray-400 transition-colors hover:bg-gray-700/50"
                        title="Upload Image (Coming Soon)"
                    >
                        <Camera className="h-5 w-5" />
                    </button>
                </form>
                <div className="mt-2 text-center">
                    <span className="font-mono text-[10px] text-gray-500">
                        THREAD SAVES LOCALLY ON EVERY REPLY // FACTORY MANUAL PROTOCOL ENABLED
                    </span>
                </div>
                {statusMessage && (
                    <p className="mt-2 text-center font-mono text-xs text-amber-400">{statusMessage}</p>
                )}
            </div>
        </div>
    );
};

export default DiagnosticChat;
