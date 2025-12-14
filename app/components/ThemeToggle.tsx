"use client";

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Zap, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="fixed top-24 right-6 z-[100] flex items-center gap-4">
            <motion.button
                onClick={toggleTheme}
                className={`relative flex items-center gap-3 px-5 py-2.5 rounded-full border-2 transition-all duration-500 overflow-hidden group ${theme === 'tech'
                    ? 'bg-[#0a0a0f] border-[#4a7dff] shadow-[0_0_20px_rgba(74,125,255,0.3)]'
                    : 'bg-[#111118] border-[#c084fc] shadow-[0_0_25px_rgba(192,132,252,0.4)] hover:shadow-[0_0_35px_rgba(192,132,252,0.6)]'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Minimal Mode Glow Animation */}
                {theme === 'minimal' && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#c084fc]/20 via-[#c084fc]/40 to-[#c084fc]/20 rounded-full"
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                )}

                {/* Tech Mode Background Shimmer */}
                {theme === 'tech' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}

                <div className={`relative z-10 flex items-center gap-2 font-mono text-xs font-bold tracking-widest ${theme === 'tech' ? 'text-[#4a7dff]' : 'text-[#c084fc]'
                    }`}>
                    {theme === 'tech' ? (
                        <>
                            <Moon size={16} />
                            <span>STAY MINIMAL</span>
                        </>
                    ) : (
                        <>
                            <Zap size={16} className="animate-pulse" />
                            <span>ENTER THE MATRIX</span>
                        </>
                    )}
                </div>

                {/* Toggle Indicator */}
                <motion.div
                    className={`absolute w-full h-full inset-0 pointer-events-none ${theme === 'tech' ? 'opacity-100' : 'opacity-0'}`}
                    initial={false}
                    animate={{ opacity: theme === 'tech' ? 1 : 0 }}
                >
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#4a7dff] rounded-full shadow-[0_0_10px_#4a7dff]" />
                </motion.div>
            </motion.button>
        </div>
    );
};

export default ThemeToggle;
