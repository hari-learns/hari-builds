"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const TechHUD = () => {
    const { isTech } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState('00:00:00');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isTech || !mounted) return;

        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);

        return () => clearInterval(interval);
    }, [isTech, mounted]);

    if (!isTech || !mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[45] pointer-events-none font-mono text-[10px] md:text-xs text-[#4a7dff] select-none"
        >
            {/* Top Left - Minimal info */}
            <div className="absolute top-20 left-6 flex items-center gap-2 opacity-60">
                <div className="w-1.5 h-1.5 bg-[#4a7dff] rounded-full animate-pulse shadow-[0_0_8px_#4a7dff]" />
                <span className="tracking-widest">SYS:ONLINE</span>
            </div>

            {/* Bottom Left - Time */}
            <div className="absolute bottom-6 left-6 opacity-60">
                <div className="tracking-widest">{time}</div>
            </div>

            {/* Bottom Right - Status bars */}
            <div className="absolute bottom-6 right-6 text-right flex flex-col gap-1.5 opacity-60">
                <div className="flex items-center gap-2 justify-end">
                    <span className="tracking-widest text-[8px]">CPU</span>
                    <div className="w-16 h-1.5 bg-[#0a0e27] border border-[#4a7dff]/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#4a7dff] shadow-[0_0_6px_#4a7dff]"
                            animate={{ width: ['30%', '60%', '45%', '55%', '40%'] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <span className="tracking-widest text-[8px]">MEM</span>
                    <div className="w-16 h-1.5 bg-[#0a0e27] border border-[#4a7dff]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#22d3ee] w-[65%] shadow-[0_0_6px_#22d3ee]" />
                    </div>
                </div>
            </div>

            {/* Corner brackets for that HUD feel */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#4a7dff]/30" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#4a7dff]/30" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#4a7dff]/30" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#4a7dff]/30" />
        </motion.div>
    );
};

export default TechHUD;
