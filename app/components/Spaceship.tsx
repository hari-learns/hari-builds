"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { Zap } from "lucide-react";

const Spaceship = () => {
    const { isTech } = useTheme();
    const positionControls = useAnimation();
    const rotationControls = useAnimation();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Set initial window size
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (windowSize.width === 0) return;

        const moveSpaceship = async () => {
            let currentX = Math.random() * windowSize.width;
            let currentY = Math.random() * windowSize.height;

            // Set initial position immediately without animation
            positionControls.set({ x: currentX, y: currentY, opacity: 0 });
            await positionControls.start({ opacity: 1, transition: { duration: 1 } });

            while (true) {
                const nextX = Math.random() * (windowSize.width - 50);
                const nextY = Math.random() * (windowSize.height - 50);

                const deltaX = nextX - currentX;
                const deltaY = nextY - currentY;

                const angleRad = Math.atan2(deltaY, deltaX);
                const angleDeg = angleRad * (180 / Math.PI);

                const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
                const speed = isTech ? 100 : 50; // Faster in Tech mode
                const duration = distance / speed;

                // Rotate the ship only
                await rotationControls.start({
                    rotate: angleDeg + 90,
                    transition: { duration: 0.5, ease: "easeInOut" }
                });

                // Move the container
                await positionControls.start({
                    x: nextX,
                    y: nextY,
                    transition: {
                        duration: duration,
                        ease: "linear"
                    }
                });

                currentX = nextX;
                currentY = nextY;
            }
        };

        moveSpaceship();
    }, [windowSize, positionControls, rotationControls, isTech]);

    const handleClick = () => {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
    };

    return (
        <motion.div
            animate={positionControls}
            className="fixed z-40 cursor-pointer"
            initial={{ opacity: 0 }}
            onClick={handleClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -60, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap z-50 pointer-events-none ${isTech
                                ? "bg-[#0a0a0f] text-[#4a7dff] border-2 border-[#4a7dff] shadow-[0_0_20px_rgba(74,125,255,0.6)]"
                                : "bg-white text-[#0a0a0f] border-2 border-[#22d3ee] shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                            }`}
                    >
                        {isTech ? "SYSTEM PATROL ACTIVE" : "Glad to see you here! you are Awesome."}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r-2 border-b-2 ${isTech ? "bg-[#0a0a0f] border-[#4a7dff]" : "bg-white border-[#22d3ee]"
                            }`}></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div animate={rotationControls}>
                {isTech ? (
                    // Tech Mode: Retro Fighter
                    <div className="relative">
                        <Zap size={40} className="text-[#4a7dff] fill-[#4a7dff]/20 rotate-180 drop-shadow-[0_0_10px_#4a7dff]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#4a7dff]/10 blur-md rounded-full animate-pulse"></div>
                    </div>
                ) : (
                    // Cute Spaceship SVG
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    >
                        {/* Flame */}
                        <motion.path
                            d="M12 22C12 22 10 18 10 16H14C14 18 12 22 12 22Z"
                            fill="#f97316"
                            animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                        />
                        {/* Body */}
                        <path
                            d="M12 2C12 2 4 8 4 14C4 18 6 20 6 20L8 18V16H16V18L18 20C18 20 20 18 20 14C20 8 12 2 12 2Z"
                            fill="#e4e4e7"
                            stroke="#0a0a0f"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Window */}
                        <circle cx="12" cy="11" r="2.5" fill="#22d3ee" />
                        {/* Fins */}
                        <path d="M4 14C4 14 2 16 2 18L6 20" stroke="#e4e4e7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 14C20 14 22 16 22 18L18 20" stroke="#e4e4e7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Spaceship;
