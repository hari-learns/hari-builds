"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const BootSequence = () => {
    const { isTech, theme } = useTheme();
    const [showBoot, setShowBoot] = useState(false);
    const [lines, setLines] = useState<string[]>([]);
    const [bootType, setBootType] = useState<'tech' | 'minimal'>('tech');
    const prevThemeRef = useRef<string | null>(null);

    useEffect(() => {
        // Only trigger boot sequence on theme CHANGE (not initial load)
        if (prevThemeRef.current !== null && prevThemeRef.current !== theme) {
            setBootType(theme === 'tech' ? 'tech' : 'minimal');
            setShowBoot(true);
            setLines([]);

            const techSequence = [
                "INITIALIZING MATRIX PROTOCOL...",
                "LOADING AI CORE... [████████] 100%",
                "ESTABLISHING NEURAL LINK...",
                "HOLOGRAPHIC DISPLAY... ACTIVE",
                "SYSTEM READY."
            ];

            const minimalSequence = [
                "Simplifying...",
                "Breathing space...",
                "Finding clarity...",
                "Less is more.",
                "Welcome back."
            ];

            const sequence = theme === 'tech' ? techSequence : minimalSequence;

            let delay = 0;
            sequence.forEach((line) => {
                setTimeout(() => {
                    setLines(prev => [...prev, line]);
                }, delay);
                delay += theme === 'tech' ? 250 : 400;
            });

            setTimeout(() => {
                setShowBoot(false);
            }, delay + 600);
        }

        prevThemeRef.current = theme;
    }, [theme, isTech]);

    return (
        <AnimatePresence>
            {showBoot && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`fixed inset-0 z-[200] flex items-center justify-center ${bootType === 'tech'
                            ? 'bg-[#0a0a0f] font-mono text-[#4a7dff]'
                            : 'bg-[#0a0a0f] font-sans text-[#e4e4e7]'
                        }`}
                >
                    <div className="w-full max-w-lg p-8 text-center">
                        {lines.map((line, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: bootType === 'tech' ? 0 : 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: bootType === 'tech' ? 0.2 : 0.5,
                                    ease: bootType === 'tech' ? 'linear' : 'easeOut'
                                }}
                                className={`mb-3 ${bootType === 'tech'
                                        ? 'text-left text-sm'
                                        : 'text-2xl font-light tracking-wide'
                                    }`}
                            >
                                {bootType === 'tech' && (
                                    <span className="opacity-50 mr-2">{`>`}</span>
                                )}
                                <span className={bootType === 'minimal' ? 'text-[#c084fc]' : ''}>
                                    {line}
                                </span>
                            </motion.div>
                        ))}

                        {/* Cursor/Indicator */}
                        {bootType === 'tech' ? (
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="inline-block w-3 h-5 bg-[#4a7dff] ml-2 align-middle shadow-[0_0_10px_#4a7dff]"
                            />
                        ) : (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                transition={{ delay: 1.5, duration: 0.5 }}
                                className="mt-8"
                            >
                                <div className="w-12 h-12 mx-auto rounded-full border-2 border-[#c084fc]/50 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-[#c084fc] rounded-full animate-pulse" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BootSequence;
