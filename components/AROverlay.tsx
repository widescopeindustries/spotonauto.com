import React from 'react';
import Webcam from 'react-webcam';
import { Camera, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AROverlay: React.FC = () => {
    // Placeholder logic for AR
    return (
        <div className="relative w-full h-[500px] bg-black rounded-2xl overflow-hidden border border-neon-cyan/30 shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center text-white z-0">
                <Webcam
                    audio={false}
                    className="w-full h-full object-cover opacity-60"
                    mirrored={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                />
            </div>

            {/* AR HUD Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg className="w-full h-full opacity-50">
                    <motion.rect
                        x="20%" y="30%" width="200" height="150"
                        fill="none"
                        stroke="#00f3ff"
                        strokeWidth="2"
                        strokeDasharray="10 5"
                        animate={{ strokeDashoffset: [0, 100] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00f3ff" strokeOpacity="0.2" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00f3ff" strokeOpacity="0.2" />
                </svg>

                {/* Mock Detection Tag */}
                <motion.div
                    className="absolute top-[25%] left-[20%] bg-black/80 border border-neon-amber text-neon-amber p-2 text-xs font-bold font-mono rounded"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                >
                    <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Potential Leak Detected
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-4 left-0 w-full text-center z-20">
                <p className="text-neon-cyan bg-black/50 inline-block px-3 py-1 rounded text-sm font-mono tracking-widest">AR MODE :: SCANNING ENGINE BAY</p>
            </div>
        </div>
    );
};

export default AROverlay;
