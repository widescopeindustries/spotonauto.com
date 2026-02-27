import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ConfidenceScore: React.FC<{ score: number; label: string }> = ({ score, label }) => {
    return (
        <div className="flex items-center gap-3 font-mono text-xs text-neon-cyan/80 p-2 border border-neon-cyan/20 rounded bg-black/60">
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="transparent"
                        stroke="rgba(0, 243, 255, 0.2)"
                        strokeWidth="2"
                    />
                    <motion.circle
                        initial={{ strokeDashoffset: 88 }}
                        animate={{ strokeDashoffset: 88 - (88 * score) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="16"
                        cy="16"
                        r="14"
                        fill="transparent"
                        stroke="#00f3ff"
                        strokeWidth="2"
                        strokeDasharray="88"
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-[8px] font-bold">{score}%</span>
            </div>
            <div>
                <div className="uppercase tracking-widest text-[9px] text-gray-400">Probability</div>
                <div className="font-bold text-white">{label}</div>
            </div>
        </div>
    );
};

export default ConfidenceScore;
