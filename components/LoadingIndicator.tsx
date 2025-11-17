
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Consulting the digital master mechanic...",
  "Searching millions of service bulletins...",
  "Drafting your custom repair guide...",
  "Illustrating the tricky parts...",
  "Calculating torque specs...",
  "Polishing the final instructions...",
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg">
      <div className="w-16 h-16 border-4 border-brand-cyan border-t-transparent border-solid rounded-full animate-spin mb-6 shadow-glow-cyan"></div>
      <h2 className="text-2xl font-bold text-brand-cyan-light mb-2 uppercase tracking-widest">Generating Your Guide</h2>
      <p className="text-gray-300 transition-opacity duration-500 ease-in-out">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;