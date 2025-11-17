
import React, { useState, useEffect, useRef } from 'react';
import type { Vehicle, ChatMessage } from '../types';
import { createDiagnosticChat, sendDiagnosticMessage } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { WrenchIcon } from './Icons';

interface DiagnosticAssistantProps {
  vehicle: Vehicle;
  initialProblem: string;
  onReset: () => void;
}

const DiagnosticAssistant: React.FC<DiagnosticAssistantProps> = ({ vehicle, initialProblem, onReset }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const chatInstance = createDiagnosticChat(vehicle);
      setChat(chatInstance);
      
      const initialUserMessage: ChatMessage = { role: 'user', text: initialProblem };
      setMessages([initialUserMessage]);

      const modelResponse = await sendDiagnosticMessage(chatInstance, initialProblem);
      const initialModelMessage: ChatMessage = { role: 'model', ...modelResponse };
      setMessages(prev => [...prev, initialModelMessage]);
      setIsLoading(false);
    };
    initChat();
  }, [vehicle, initialProblem]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const modelResponse = await sendDiagnosticMessage(chat, userMessage.text);
    const newModelMessage: ChatMessage = { role: 'model', ...modelResponse };
    setMessages(prev => [...prev, newModelMessage]);
    setIsLoading(false);
  };

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
      <div className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl ${isModel ? 'bg-gray-900 text-gray-200 rounded-bl-none' : 'bg-brand-cyan text-black font-medium rounded-br-none'}`}>
          <p className="text-base leading-relaxed">{message.text}</p>
          {isModel && message.imageUrl && (
            <div className="mt-4 bg-black rounded-lg p-2 border border-brand-cyan/30">
              <img src={message.imageUrl} alt="Diagnostic illustration" className="rounded-md w-full h-auto" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-[90vh] flex flex-col bg-black/50 backdrop-blur-sm border border-brand-cyan/30 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
      <header className="p-4 flex justify-between items-center border-b border-brand-cyan/30 flex-shrink-0">
        <div className="flex items-center gap-3">
            <WrenchIcon className="w-6 h-6 text-brand-cyan" />
            <div>
                <h1 className="text-lg font-bold text-white uppercase tracking-wider">Diagnostic Assistant</h1>
                <p className="text-sm text-brand-cyan font-semibold">{`${vehicle.year} ${vehicle.make} ${vehicle.model}`}</p>
            </div>
        </div>
        <button onClick={onReset} className="text-sm font-semibold text-brand-cyan hover:underline">New Search</button>
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
        {messages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl bg-gray-900 rounded-bl-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-brand-cyan/30 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe what you see or the result of the test..."
            className="flex-grow w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="px-6 py-3 bg-brand-cyan text-black font-bold rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
};

export default DiagnosticAssistant;