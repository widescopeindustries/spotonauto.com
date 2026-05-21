import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Camera, Cpu, HardDrive, ImageIcon, Mic, MicOff, RotateCcw, Send, ThumbsDown, ThumbsUp, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { buildSymptomHref, getSymptomClusterFromText } from '@/data/symptomGraph';
import { createDiagnosticChat, sendDiagnosticMessage, type Chat } from '../services/apiClient';
import { COMPANY_INFO } from '@/lib/companyInfo';
import {
    findLatestDiagnosticSessionForVehicle,
    getDiagnosticSession,
    saveDiagnosticSession,
    type StoredDiagnosticMessage,
} from '../services/diagnosticMemory';
import type { Vehicle } from '../types';
import TopdonDiagnosticInjected from './TopdonDiagnosticInjected';
import PartsConcierge from './PartsConcierge';

interface DiagnosticChatProps {
    vehicle?: Vehicle;
    initialProblem?: string;
    className?: string;
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
        return `Hey, I'm Manuel — your factory-trained mechanic for the ${vehicle.year} ${vehicle.make} ${vehicle.model}. You mentioned "${initialProblem}". Let me pull the exact diagnostic flowchart from the OEM manual. What do you see or hear right now?`;
    }

    return `Hey, I'm Manuel — your factory-trained mechanic for the ${vehicle.year} ${vehicle.make} ${vehicle.model}. I have the full service manual, wiring diagrams, torque specs, and diagnostic procedures for your car. What's going on with it?`;
}

// ─── Web Speech API helpers ──────────────────────────────────────────────────

function getSpeechRecognition(): any | null {
    if (typeof window === 'undefined') return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function speakText(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const clean = text
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/\n{2,}/g, '\n')
        .slice(0, 400);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

type SpeechError = 'not-allowed' | 'no-speech' | 'network' | 'aborted' | null;

function getSpeechErrorMessage(err: SpeechError): string {
    switch (err) {
        case 'not-allowed':
            return 'Microphone permission denied. Click the lock icon in your browser address bar and allow microphone access.';
        case 'no-speech':
            return 'No speech detected. Try speaking louder or closer to the mic.';
        case 'network':
            return 'Speech recognition network error. Check your connection and try again.';
        case 'aborted':
            return '';
        default:
            return 'Speech recognition failed. Try typing instead.';
    }
}

const DiagnosticChat: React.FC<DiagnosticChatProps> = ({ vehicle: vehicleProp, initialProblem: initialProblemProp, className }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [typing, setTyping] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [userInput, setUserInput] = useState('');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [sessionCreatedAt, setSessionCreatedAt] = useState<string | null>(null);
    const [messageRatings, setMessageRatings] = useState<Record<string, 'up' | 'down'>>({});
    const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
    const [feedbackOpenFor, setFeedbackOpenFor] = useState<string | null>(null);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [speechError, setSpeechError] = useState<SpeechError>(null);
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any | null>(null);
    const micButtonRef = useRef<HTMLButtonElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastSpokenRef = useRef<string>('');
    const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    useEffect(() => {
        const supported = !!getSpeechRecognition() && typeof window !== 'undefined' && !!window.speechSynthesis;
        setSpeechSupported(supported);
    }, []);

    // Clear speech error after 5 seconds
    useEffect(() => {
        if (!speechError) return;
        const timer = setTimeout(() => setSpeechError(null), 5000);
        return () => clearTimeout(timer);
    }, [speechError]);

    // Auto-speak new system messages when voice is enabled
    useEffect(() => {
        if (!voiceEnabled || messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.type === 'system' && lastMsg.id !== lastSpokenRef.current) {
            lastSpokenRef.current = lastMsg.id;
            speakText(lastMsg.text);
        }
    }, [messages, voiceEnabled]);

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
            setMessageRatings({});
            setFeedbackDrafts({});
            setFeedbackOpenFor(null);

            const storedSession = !forceFresh
                ? (threadId ? getDiagnosticSession(threadId) : findLatestDiagnosticSessionForVehicle(vehicle))
                : null;

            if (storedSession && vehiclesMatch(storedSession.vehicle, vehicle)) {
                if (cancelled) return;

                setChatSession(createDiagnosticChat(vehicle, {
                    id: storedSession.id,
                    history: storedSession.history,
                }));
                const sanitizedMessages = storedSession.messages.map((m, idx) => ({
                    ...m,
                    id: m.id && m.id !== 'undefined' ? m.id : `restored-${storedSession.id}-${idx}`,
                }));
                setMessages(sanitizedMessages);
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
        stopSpeaking();

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleUserResponse(userInput);
    };

    const handleRate = (messageId: string, value: 'up' | 'down') => {
        setMessageRatings((prev) => ({ ...prev, [messageId]: value }));
        if (value === 'down') setFeedbackOpenFor(messageId);
    };

    const sendFeedback = (messageId: string) => {
        const rating = messageRatings[messageId] || 'down';
        const feedback = feedbackDrafts[messageId] || '';
        const aiMessage = messages.find((message) => message.id === messageId);
        const excerpt = aiMessage?.text?.slice(0, 700) || '';
        const vehicleLabel = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle';
        const subject = encodeURIComponent(`AllOEMManuals diagnostic feedback (${rating})`);
        const body = encodeURIComponent(
            `Thread ID: ${chatSession?.id || 'unknown'}\nVehicle: ${vehicleLabel}\nRating: ${rating}\n\nAI response:\n${excerpt}\n\nUser feedback:\n${feedback || '(no extra notes)'}`
        );
        window.location.href = `mailto:${COMPANY_INFO.supportEmail}?subject=${subject}&body=${body}`;
        setFeedbackOpenFor(null);
    };

    const toggleVoice = () => {
        setVoiceEnabled((prev) => {
            const next = !prev;
            if (!next) stopSpeaking();
            return next;
        });
    };

    const startListening = () => {
        const SpeechRecognitionCtor = getSpeechRecognition();
        if (!SpeechRecognitionCtor) {
            console.error('[Manuel] SpeechRecognition not available in this browser');
            setSpeechError('network');
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch { /* ignore */ }
        }

        setSpeechError(null);
        setInterimTranscript('');

        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        let capturedTranscript = '';

        recognition.onstart = () => {
            console.log('[Manuel] 🎤 Speech recognition STARTED');
            setIsListening(true);
            setSpeechError(null);
        };

        recognition.onend = () => {
            console.log('[Manuel] 🎤 Speech recognition ENDED. Captured:', capturedTranscript);
            setIsListening(false);
            setInterimTranscript('');
            if (capturedTranscript.trim() && !typing) {
                handleUserResponse(capturedTranscript.trim());
                setUserInput('');
                capturedTranscript = '';
            }
        };

        recognition.onerror = (event: any) => {
            console.warn('[Manuel] Speech recognition error:', event.error, event.message);
            setIsListening(false);
            if (event.error !== 'aborted') {
                setSpeechError(event.error as SpeechError);
            }
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                    console.log('[Manuel] Final result:', result[0].transcript);
                } else {
                    interim += result[0].transcript;
                }
            }
            if (final) {
                capturedTranscript += final;
                setUserInput(capturedTranscript);
            }
            setInterimTranscript(interim);
        };

        recognitionRef.current = recognition;

        try {
            console.log('[Manuel] Calling recognition.start()...');
            recognition.start();
        } catch (err) {
            console.error('[Manuel] Failed to start recognition:', err);
            setSpeechError('network');
        }
    };

    const stopListening = () => {
        console.log('[Manuel] Stopping recognition...');
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* ignore */ }
        }
        setIsListening(false);
        setInterimTranscript('');
    };

    // Toggle listening on click (primary interaction)
    const handleMicClick = () => {
        if (typing || !speechSupported) return;
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Also support push-to-hold on pointer down/up for mobile
    const micPressStartRef = useRef<number>(0);
    const handleMicPointerDown = (e: React.PointerEvent) => {
        micPressStartRef.current = Date.now();
        if (typing || !speechSupported || isListening) return;
        // Small delay to distinguish click from hold
        setTimeout(() => {
            if (micPressStartRef.current > 0 && !isListening) {
                startListening();
            }
        }, 200);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleMicPointerUp = () => {
        const pressDuration = Date.now() - micPressStartRef.current;
        micPressStartRef.current = 0;
        // If held for > 300ms, treat as push-to-talk release
        if (pressDuration > 300 && isListening) {
            stopListening();
        }
        // Otherwise it's a click — handleMicClick will handle toggle
    };

    return (
        <div className={`relative mx-auto flex h-[600px] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neon-cyan/20 bg-black/80 shadow-2xl backdrop-blur-xl ${className || ''}`}>
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="z-10 flex items-center justify-between border-b border-neon-cyan/20 bg-black/50 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
                    <div>
                        <h3 className="font-mono text-sm tracking-widest text-neon-cyan">
                            MANUEL // {vehicle?.year} {vehicle?.make} {vehicle?.model || 'NO VEHICLE LINKED'}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">
                            <HardDrive className="h-3.5 w-3.5" />
                            <span>Factory manual memory active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {speechSupported && (
                        <button
                            type="button"
                            onClick={toggleVoice}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                                voiceEnabled
                                    ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                                    : 'border-white/10 bg-white/[0.04] text-gray-400 hover:border-cyan-500/30 hover:text-cyan-100'
                            }`}
                            title={voiceEnabled ? 'Voice output on — AI will speak responses' : 'Voice output off'}
                        >
                            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                            {voiceEnabled ? 'Voice On' : 'Voice Off'}
                        </button>
                    )}
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
                    {messages.map((msg, index) => (
                        <motion.div
                            key={(!msg.id || msg.id === 'undefined') ? `msg-${index}` : msg.id}
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

                                {msg.type === 'system' && (
                                    <PartsConcierge
                                        text={msg.text}
                                        vehicle={vehicle ? { year: vehicle.year, make: vehicle.make, model: vehicle.model } : undefined}
                                    />
                                )}

                                {msg.type === 'system' && (
                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-lg border border-orange-400/35 bg-orange-500/10 p-3 text-xs leading-5 text-orange-100">
                                            This is AI-generated guidance from Manuel, grounded in factory service manual data. Always verify critical torque specs and safety procedures with your official manual.
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                            <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Rate this diagnosis</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRate(msg.id, 'up')}
                                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${messageRatings[msg.id] === 'up'
                                                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
                                                        : 'border-white/15 bg-white/[0.03] text-gray-200 hover:border-emerald-400/40'
                                                        }`}
                                                >
                                                    <ThumbsUp className="h-3.5 w-3.5" />
                                                    Helpful
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRate(msg.id, 'down')}
                                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${messageRatings[msg.id] === 'down'
                                                        ? 'border-red-400/50 bg-red-500/20 text-red-100'
                                                        : 'border-white/15 bg-white/[0.03] text-gray-200 hover:border-red-400/40'
                                                        }`}
                                                >
                                                    <ThumbsDown className="h-3.5 w-3.5" />
                                                    Not accurate
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFeedbackOpenFor(feedbackOpenFor === msg.id ? null : msg.id)}
                                                    className="ml-auto text-[11px] text-cyan-200 underline decoration-cyan-400/40 underline-offset-2 hover:text-cyan-100"
                                                >
                                                    Optional feedback
                                                </button>
                                            </div>
                                            {feedbackOpenFor === msg.id && (
                                                <div className="mt-3 space-y-2">
                                                    <textarea
                                                        value={feedbackDrafts[msg.id] || ''}
                                                        onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                                                        rows={3}
                                                        placeholder="Tell us what looked wrong or missing..."
                                                        className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => sendFeedback(msg.id)}
                                                        className="inline-flex items-center rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-cyan-300"
                                                    >
                                                        Send feedback
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                                <p className="text-[10px] uppercase tracking-[0.24em] text-amber-300/85">Related symptoms</p>
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
                                        href={vehicle ? `/vehicles/${vehicle.year}/${vehicle.make.toLowerCase()}/${vehicle.model.toLowerCase().replace(/\s+/g, '-')}/repair/${task}` : `/repairs/${task}`}
                                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 hover:border-cyan-400/35 hover:text-cyan-200 transition-all"
                                    >
                                        {task.replace(/-/g, ' ')}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* Speech error banner */}
                {speechError && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                        <span className="text-xs text-red-200">{getSpeechErrorMessage(speechError)}</span>
                    </div>
                )}

                {/* Listening overlay / waveform */}
                {isListening && (
                    <div className="mb-3 flex items-center gap-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3">
                        <div className="flex items-end gap-0.5 h-5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-cyan-400 rounded-full"
                                    animate={{ height: [4, 16, 8, 20, 6] }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: 'easeInOut',
                                    }}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-mono text-cyan-200">
                            {interimTranscript || 'Listening... hold to speak, release to send'}
                        </span>
                    </div>
                )}

                <form onSubmit={onSubmit} className="relative flex gap-3">
                    <div className="absolute inset-0 -z-10 bg-neon-cyan/5 blur-xl" />
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={typing ? 'Manuel is thinking...' : 'Describe symptoms, read me a code, or ask a repair question...'}
                        className="flex-1 rounded-lg border border-neon-cyan/30 bg-black/50 px-4 py-3 font-mono text-sm text-white placeholder-gray-500 transition-all focus:border-neon-cyan focus:outline-none focus:shadow-glow-cyan"
                        disabled={typing || isListening}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={typing || isListening || !userInput.trim()}
                        className="flex items-center justify-center rounded-lg border border-neon-cyan bg-neon-cyan/10 px-4 text-neon-cyan transition-all hover:bg-neon-cyan/20 hover:shadow-glow-cyan disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                    {speechSupported && (
                        <button
                            ref={micButtonRef}
                            type="button"
                            onClick={handleMicClick}
                            onPointerDown={handleMicPointerDown}
                            onPointerUp={handleMicPointerUp}
                            onPointerCancel={handleMicPointerUp}
                            disabled={typing}
                            className={`flex items-center justify-center rounded-lg border px-4 transition-all select-none disabled:cursor-not-allowed disabled:opacity-50 ${
                                isListening
                                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse'
                                    : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 active:bg-gray-600/50'
                            }`}
                            title={isListening ? 'Tap to send' : 'Tap to speak'}
                            style={{ touchAction: 'none' }}
                        >
                            {isListening ? <Mic className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                    )}
                    {!speechSupported && (
                        <button
                            type="button"
                            disabled
                            className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-900/30 px-4 text-gray-600 cursor-not-allowed"
                            title="Voice input not supported in this browser"
                        >
                            <MicOff className="h-5 w-5" />
                        </button>
                    )}
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
                        {speechSupported
                            ? 'MANUEL REMEMBERS THIS CONVERSATION // HOLD MIC TO TALK'
                            : 'MANUEL REMEMBERS THIS CONVERSATION // TYPE YOUR MESSAGE'}
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
